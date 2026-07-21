import type { DeployFunction } from "hardhat-deploy/types";

const LOCAL_CHAIN_ID = 31_337n;
const ALLOWED_LOCAL_NETWORKS = new Set(["hardhat", "localhost"]);

const TOKEN_DECIMALS = 6;
const DEFAULT_TENOR_DAYS = 180n;
const DEFAULT_APR_BPS = 200n;
const DEFAULT_MIN_DEPOSIT = 100n * 10n ** 6n;
const DEFAULT_MAX_DEPOSIT = 10_000n * 10n ** 6n;
const DEFAULT_PENALTY_BPS = 750n;

const DEMO_USER_ONE_TARGET = 5_000n * 10n ** 6n;
const DEMO_USER_TWO_TARGET = 10_000n * 10n ** 6n;
const VAULT_TARGET_BALANCE = 25_000n * 10n ** 6n;

type DemoPlan = {
  tenorDays: bigint;
  aprBps: bigint;
  minDeposit: bigint;
  maxDeposit: bigint;
  earlyWithdrawPenaltyBps: bigint;
  enabled: boolean;
};

const seedDemo: DeployFunction = async function (hre) {
  const {
    deployments,
    ethers,
    getChainId,
    getNamedAccounts,
    network,
  } = hre;

  const { get, log } = deployments;

  if (!ALLOWED_LOCAL_NETWORKS.has(network.name)) {
    throw new Error(
      `Demo seed is disabled on network "${network.name}".`,
    );
  }

  const configuredChainId = BigInt(await getChainId());
  const runtimeNetwork = await ethers.provider.getNetwork();

  if (
    configuredChainId !== LOCAL_CHAIN_ID ||
    runtimeNetwork.chainId !== LOCAL_CHAIN_ID
  ) {
    throw new Error(
      `Expected local chain ID ${LOCAL_CHAIN_ID}, received configured=${configuredChainId} runtime=${runtimeNetwork.chainId}.`,
    );
  }

  const {
    admin,
    feeReceiver,
    demoUserOne,
    demoUserTwo,
    keeper,
  } = await getNamedAccounts();

  if (
    !admin ||
    !feeReceiver ||
    !demoUserOne ||
    !demoUserTwo ||
    !keeper
  ) {
    throw new Error(
      "Named admin, feeReceiver, demo users, and keeper must be configured.",
    );
  }

  const normalizedRoles = [
    admin,
    feeReceiver,
    demoUserOne,
    demoUserTwo,
    keeper,
  ].map((address) => ethers.getAddress(address));

  if (new Set(normalizedRoles).size !== normalizedRoles.length) {
    throw new Error(
      "Local admin, fee receiver, demo users, and keeper must use distinct addresses.",
    );
  }

  const tokenDeployment = await get("MockUSDC");
  const vaultDeployment = await get("VaultManager");
  const savingCoreDeployment = await get("SavingCore");

  const [tokenCode, vaultCode, savingCoreCode] = await Promise.all([
    ethers.provider.getCode(tokenDeployment.address),
    ethers.provider.getCode(vaultDeployment.address),
    ethers.provider.getCode(savingCoreDeployment.address),
  ]);

  if (
    tokenCode === "0x" ||
    vaultCode === "0x" ||
    savingCoreCode === "0x"
  ) {
    throw new Error(
      "Demo seed requires deployed MockUSDC, VaultManager, and SavingCore bytecode.",
    );
  }

  const token = await ethers.getContractAt(
    "MockUSDC",
    tokenDeployment.address,
  );

  const vault = await ethers.getContractAt(
    "VaultManager",
    vaultDeployment.address,
  );

  const savingCore = await ethers.getContractAt(
    "SavingCore",
    savingCoreDeployment.address,
  );

  const adminSigner = await ethers.getSigner(admin);

  const connectedToken = token.connect(adminSigner);
  const connectedVault = vault.connect(adminSigner);
  const connectedSavingCore = savingCore.connect(adminSigner);

  const [
    decimals,
    vaultOwner,
    savingCoreOwner,
    authorizedSavingCore,
  ] = await Promise.all([
    token.decimals(),
    vault.owner(),
    savingCore.owner(),
    vault.savingCore(),
  ]);

  if (decimals !== BigInt(TOKEN_DECIMALS)) {
    throw new Error(
      `MockUSDC decimals mismatch: expected=${TOKEN_DECIMALS} actual=${decimals}.`,
    );
  }

  if (
    ethers.getAddress(vaultOwner) !== ethers.getAddress(admin) ||
    ethers.getAddress(savingCoreOwner) !== ethers.getAddress(admin)
  ) {
    throw new Error(
      `Admin ownership mismatch: VaultManager=${vaultOwner} SavingCore=${savingCoreOwner} expected=${admin}.`,
    );
  }

  if (
    ethers.getAddress(authorizedSavingCore) !==
    ethers.getAddress(savingCoreDeployment.address)
  ) {
    throw new Error(
      `VaultManager has not authorized the expected SavingCore: expected=${savingCoreDeployment.address} actual=${authorizedSavingCore}.`,
    );
  }

  let planCount = await savingCore.planCount();

  if (planCount === 0n) {
    const transaction = await connectedSavingCore.createPlan(
      DEFAULT_TENOR_DAYS,
      DEFAULT_APR_BPS,
      DEFAULT_MIN_DEPOSIT,
      DEFAULT_MAX_DEPOSIT,
      DEFAULT_PENALTY_BPS,
      true,
    );

    const receipt = await transaction.wait();

    if (!receipt || receipt.status !== 1) {
      throw new Error(
        `Default-plan transaction ${transaction.hash} did not succeed.`,
      );
    }

    planCount = await savingCore.planCount();

    if (planCount !== 1n) {
      throw new Error(
        `Expected default plan ID 1, but planCount is ${planCount}.`,
      );
    }

    log("Created canonical SafeBank default plan with ID 1.");
  }

  const defaultPlan = (await savingCore.getPlan(1n)) as DemoPlan;

  if (
    defaultPlan.tenorDays !== DEFAULT_TENOR_DAYS ||
    defaultPlan.aprBps !== DEFAULT_APR_BPS ||
    defaultPlan.minDeposit !== DEFAULT_MIN_DEPOSIT ||
    defaultPlan.maxDeposit !== DEFAULT_MAX_DEPOSIT ||
    defaultPlan.earlyWithdrawPenaltyBps !== DEFAULT_PENALTY_BPS ||
    !defaultPlan.enabled
  ) {
    throw new Error(
      `Plan 1 does not match the canonical demo plan: tenor=${defaultPlan.tenorDays}, apr=${defaultPlan.aprBps}, min=${defaultPlan.minDeposit}, max=${defaultPlan.maxDeposit}, penalty=${defaultPlan.earlyWithdrawPenaltyBps}, enabled=${defaultPlan.enabled}.`,
    );
  }

  const ensureMinimumBalance = async (
    recipient: string,
    targetBalance: bigint,
    label: string,
  ): Promise<void> => {
    const currentBalance = await token.balanceOf(recipient);

    if (currentBalance >= targetBalance) {
      log(
        `${label} balance already meets target: ${ethers.formatUnits(currentBalance, TOKEN_DECIMALS)} mUSDC.`,
      );
      return;
    }

    const mintAmount = targetBalance - currentBalance;
    const transaction = await connectedToken.mint(
      recipient,
      mintAmount,
    );

    const receipt = await transaction.wait();

    if (!receipt || receipt.status !== 1) {
      throw new Error(
        `${label} mint transaction ${transaction.hash} did not succeed.`,
      );
    }

    const balanceAfterMint = await token.balanceOf(recipient);

    if (balanceAfterMint !== targetBalance) {
      throw new Error(
        `${label} target balance mismatch: expected=${targetBalance} actual=${balanceAfterMint}.`,
      );
    }

    log(
      `${label} funded to ${ethers.formatUnits(balanceAfterMint, TOKEN_DECIMALS)} mUSDC.`,
    );
  };

  await ensureMinimumBalance(
    demoUserOne,
    DEMO_USER_ONE_TARGET,
    "Demo user one",
  );

  await ensureMinimumBalance(
    demoUserTwo,
    DEMO_USER_TWO_TARGET,
    "Demo user two",
  );

  const vaultBalanceBeforeFunding = await vault.vaultBalance();

  if (vaultBalanceBeforeFunding > VAULT_TARGET_BALANCE) {
    throw new Error(
      `Vault balance ${vaultBalanceBeforeFunding} exceeds configured demo target ${VAULT_TARGET_BALANCE}.`,
    );
  }

  if (vaultBalanceBeforeFunding < VAULT_TARGET_BALANCE) {
    const fundingDelta =
      VAULT_TARGET_BALANCE - vaultBalanceBeforeFunding;

    const adminBalance = await token.balanceOf(admin);

    if (adminBalance < fundingDelta) {
      const mintDelta = fundingDelta - adminBalance;
      const mintTransaction = await connectedToken.mint(
        admin,
        mintDelta,
      );

      const mintReceipt = await mintTransaction.wait();

      if (!mintReceipt || mintReceipt.status !== 1) {
        throw new Error(
          `Admin funding mint transaction ${mintTransaction.hash} did not succeed.`,
        );
      }
    }

    const approvalTransaction = await connectedToken.approve(
      vaultDeployment.address,
      fundingDelta,
    );

    const approvalReceipt = await approvalTransaction.wait();

    if (!approvalReceipt || approvalReceipt.status !== 1) {
      throw new Error(
        `Vault approval transaction ${approvalTransaction.hash} did not succeed.`,
      );
    }

    const allowance = await token.allowance(
      admin,
      vaultDeployment.address,
    );

    if (allowance !== fundingDelta) {
      throw new Error(
        `Vault allowance mismatch: expected=${fundingDelta} actual=${allowance}.`,
      );
    }

    const fundingTransaction = await connectedVault.fundVault(
      fundingDelta,
    );

    const fundingReceipt = await fundingTransaction.wait();

    if (!fundingReceipt || fundingReceipt.status !== 1) {
      throw new Error(
        `Vault funding transaction ${fundingTransaction.hash} did not succeed.`,
      );
    }

    log(
      `Vault funded by ${ethers.formatUnits(fundingDelta, TOKEN_DECIMALS)} mUSDC.`,
    );
  } else {
    log(
      `Vault balance already equals target ${ethers.formatUnits(VAULT_TARGET_BALANCE, TOKEN_DECIMALS)} mUSDC.`,
    );
  }

  const [
    finalVaultBalance,
    totalReservedInterest,
    availableLiquidity,
    fundingShortfall,
    depositCount,
    finalDemoUserOneBalance,
    finalDemoUserTwoBalance,
  ] = await Promise.all([
    vault.vaultBalance(),
    vault.totalReservedInterest(),
    vault.availableLiquidity(),
    vault.fundingShortfall(),
    savingCore.depositCount(),
    token.balanceOf(demoUserOne),
    token.balanceOf(demoUserTwo),
  ]);

  const expectedAvailableLiquidity =
    finalVaultBalance > totalReservedInterest
      ? finalVaultBalance - totalReservedInterest
      : 0n;

  const expectedFundingShortfall =
    totalReservedInterest > finalVaultBalance
      ? totalReservedInterest - finalVaultBalance
      : 0n;

  if (finalVaultBalance !== VAULT_TARGET_BALANCE) {
    throw new Error(
      `Final vault balance mismatch: expected=${VAULT_TARGET_BALANCE} actual=${finalVaultBalance}.`,
    );
  }

  if (
    availableLiquidity !== expectedAvailableLiquidity ||
    fundingShortfall !== expectedFundingShortfall
  ) {
    throw new Error(
      `C2 metric mismatch: balance=${finalVaultBalance}, reserve=${totalReservedInterest}, available=${availableLiquidity}, shortfall=${fundingShortfall}.`,
    );
  }

  if (
    finalDemoUserOneBalance < DEMO_USER_ONE_TARGET ||
    finalDemoUserTwoBalance < DEMO_USER_TWO_TARGET
  ) {
    throw new Error(
      `Demo-user balances are below target: userOne=${finalDemoUserOneBalance}, userTwo=${finalDemoUserTwoBalance}.`,
    );
  }

  if (depositCount === 0n && totalReservedInterest !== 0n) {
    throw new Error(
      `SavingCore has no deposits but reports reserve ${totalReservedInterest}.`,
    );
  }

  log("SafeBank local demo seed verified.");
  log(`Default plan ID: 1`);
  log(
    `Demo user one balance: ${ethers.formatUnits(finalDemoUserOneBalance, TOKEN_DECIMALS)} mUSDC`,
  );
  log(
    `Demo user two balance: ${ethers.formatUnits(finalDemoUserTwoBalance, TOKEN_DECIMALS)} mUSDC`,
  );
  log(
    `Vault balance: ${ethers.formatUnits(finalVaultBalance, TOKEN_DECIMALS)} mUSDC`,
  );
  log(
    `Total reserved interest: ${ethers.formatUnits(totalReservedInterest, TOKEN_DECIMALS)} mUSDC`,
  );
  log(
    `Available liquidity: ${ethers.formatUnits(availableLiquidity, TOKEN_DECIMALS)} mUSDC`,
  );
  log(
    `Funding shortfall: ${ethers.formatUnits(fundingShortfall, TOKEN_DECIMALS)} mUSDC`,
  );
};

seedDemo.tags = ["SeedDemo", "Demo", "Local"];
seedDemo.dependencies = ["AuthorizeSavingCore"];

export default seedDemo;