import type { DeployFunction } from "hardhat-deploy/types";

const SEPOLIA_CHAIN_ID = 11_155_111n;
const CONFIRMATIONS = 2;

const EXPECTED_DEPLOYER =
  "0xA998526b0A5F23680f50fa3677f5c6576Dba89d9";

const TOKEN_DECIMALS = 6;
const DEFAULT_TENOR_DAYS = 180n;
const DEFAULT_APR_BPS = 200n;
const DEFAULT_MIN_DEPOSIT = 100n * 10n ** 6n;
const DEFAULT_MAX_DEPOSIT = 10_000n * 10n ** 6n;
const DEFAULT_PENALTY_BPS = 750n;

type PlanSnapshot = {
  tenorDays: bigint;
  aprBps: bigint;
  minDeposit: bigint;
  maxDeposit: bigint;
  earlyWithdrawPenaltyBps: bigint;
  enabled: boolean;
};

const deploySepolia: DeployFunction = async function (hre) {
  const {
    deployments,
    ethers,
    getChainId,
    getNamedAccounts,
    network,
  } = hre;

  const { deploy, log } = deployments;

  if (network.name !== "sepolia") {
    throw new Error(
      `Sepolia deployment is disabled on network "${network.name}".`,
    );
  }

  const configuredChainId = BigInt(await getChainId());
  const runtimeNetwork = await ethers.provider.getNetwork();

  if (
    configuredChainId !== SEPOLIA_CHAIN_ID ||
    runtimeNetwork.chainId !== SEPOLIA_CHAIN_ID
  ) {
    throw new Error(
      `Expected Sepolia chain ID ${SEPOLIA_CHAIN_ID}, received configured=${configuredChainId} runtime=${runtimeNetwork.chainId}.`,
    );
  }

  const { deployer } = await getNamedAccounts();

  if (!deployer) {
    throw new Error("Named deployer account is not configured.");
  }

  const normalizedDeployer = ethers.getAddress(deployer);
  const expectedDeployer = ethers.getAddress(EXPECTED_DEPLOYER);

  if (normalizedDeployer !== expectedDeployer) {
    throw new Error(
      `Unexpected Sepolia deployer ${normalizedDeployer}; expected ${expectedDeployer}.`,
    );
  }

  const signers = await ethers.getSigners();

  if (signers.length !== 1) {
    throw new Error(
      `Expected exactly one configured Sepolia signer, received ${signers.length}.`,
    );
  }

  const signerAddress = ethers.getAddress(
    await signers[0].getAddress(),
  );

  if (signerAddress !== expectedDeployer) {
    throw new Error(
      `Configured signer ${signerAddress} does not match expected deployer ${expectedDeployer}.`,
    );
  }

  const deployerBalance = await ethers.provider.getBalance(
    expectedDeployer,
  );

  if (deployerBalance === 0n) {
    throw new Error("Sepolia deployer has no ETH for gas.");
  }

  log(`Sepolia chain ID verified: ${SEPOLIA_CHAIN_ID}`);
  log(`Sepolia deployer/admin/fee receiver: ${expectedDeployer}`);
  log(
    `Sepolia deployer balance: ${ethers.formatEther(deployerBalance)} ETH`,
  );

  const mockDeployment = await deploy("MockUSDC", {
    from: expectedDeployer,
    args: [],
    log: true,
    waitConfirmations: CONFIRMATIONS,
  });

  const mockCode = await ethers.provider.getCode(
    mockDeployment.address,
  );

  if (mockCode === "0x") {
    throw new Error(
      `MockUSDC address ${mockDeployment.address} has no bytecode.`,
    );
  }

  const token = await ethers.getContractAt(
    "MockUSDC",
    mockDeployment.address,
  );

  const [tokenName, tokenSymbol, tokenDecimals] =
    await Promise.all([
      token.name(),
      token.symbol(),
      token.decimals(),
    ]);

  if (
    tokenName !== "Mock USD Coin" ||
    tokenSymbol !== "mUSDC" ||
    tokenDecimals !== BigInt(TOKEN_DECIMALS)
  ) {
    throw new Error(
      `Unexpected MockUSDC metadata: name=${tokenName}, symbol=${tokenSymbol}, decimals=${tokenDecimals}.`,
    );
  }

  const vaultDeployment = await deploy("VaultManager", {
    from: expectedDeployer,
    args: [
      mockDeployment.address,
      expectedDeployer,
      expectedDeployer,
    ],
    log: true,
    waitConfirmations: CONFIRMATIONS,
  });

  const vaultCode = await ethers.provider.getCode(
    vaultDeployment.address,
  );

  if (vaultCode === "0x") {
    throw new Error(
      `VaultManager address ${vaultDeployment.address} has no bytecode.`,
    );
  }

  const vault = await ethers.getContractAt(
    "VaultManager",
    vaultDeployment.address,
  );

  const [
    vaultToken,
    vaultOwner,
    vaultPendingOwner,
    vaultFeeReceiver,
    vaultPaused,
  ] = await Promise.all([
    vault.token(),
    vault.owner(),
    vault.pendingOwner(),
    vault.feeReceiver(),
    vault.paused(),
  ]);

  if (
    ethers.getAddress(vaultToken) !==
    ethers.getAddress(mockDeployment.address)
  ) {
    throw new Error(
      `VaultManager token mismatch: expected=${mockDeployment.address} actual=${vaultToken}.`,
    );
  }

  if (ethers.getAddress(vaultOwner) !== expectedDeployer) {
    throw new Error(
      `VaultManager owner mismatch: expected=${expectedDeployer} actual=${vaultOwner}.`,
    );
  }

  if (ethers.getAddress(vaultPendingOwner) !== ethers.ZeroAddress) {
    throw new Error(
      `VaultManager has unexpected pending owner ${vaultPendingOwner}.`,
    );
  }

  if (
    ethers.getAddress(vaultFeeReceiver) !== expectedDeployer
  ) {
    throw new Error(
      `VaultManager fee receiver mismatch: expected=${expectedDeployer} actual=${vaultFeeReceiver}.`,
    );
  }

  if (vaultPaused) {
    throw new Error("VaultManager unexpectedly starts paused.");
  }

  const coreDeployment = await deploy("SavingCore", {
    from: expectedDeployer,
    args: [
      mockDeployment.address,
      vaultDeployment.address,
      expectedDeployer,
    ],
    log: true,
    waitConfirmations: CONFIRMATIONS,
  });

  const coreCode = await ethers.provider.getCode(
    coreDeployment.address,
  );

  if (coreCode === "0x") {
    throw new Error(
      `SavingCore address ${coreDeployment.address} has no bytecode.`,
    );
  }

  const savingCore = await ethers.getContractAt(
    "SavingCore",
    coreDeployment.address,
  );

  const [
    coreToken,
    coreVault,
    coreOwner,
    corePendingOwner,
    corePaused,
    gracePeriod,
    defaultTenorDays,
    defaultAprBps,
    defaultPenaltyBps,
  ] = await Promise.all([
    savingCore.token(),
    savingCore.vaultManager(),
    savingCore.owner(),
    savingCore.pendingOwner(),
    savingCore.paused(),
    savingCore.GRACE_PERIOD(),
    savingCore.DEFAULT_TENOR_DAYS(),
    savingCore.DEFAULT_APR_BPS(),
    savingCore.DEFAULT_EARLY_WITHDRAW_PENALTY_BPS(),
  ]);

  if (
    ethers.getAddress(coreToken) !==
    ethers.getAddress(mockDeployment.address)
  ) {
    throw new Error(
      `SavingCore token mismatch: expected=${mockDeployment.address} actual=${coreToken}.`,
    );
  }

  if (
    ethers.getAddress(coreVault) !==
    ethers.getAddress(vaultDeployment.address)
  ) {
    throw new Error(
      `SavingCore vault mismatch: expected=${vaultDeployment.address} actual=${coreVault}.`,
    );
  }

  if (ethers.getAddress(coreOwner) !== expectedDeployer) {
    throw new Error(
      `SavingCore owner mismatch: expected=${expectedDeployer} actual=${coreOwner}.`,
    );
  }

  if (ethers.getAddress(corePendingOwner) !== ethers.ZeroAddress) {
    throw new Error(
      `SavingCore has unexpected pending owner ${corePendingOwner}.`,
    );
  }

  if (corePaused) {
    throw new Error("SavingCore unexpectedly starts paused.");
  }

  if (
    gracePeriod !== 2n * 24n * 60n * 60n ||
    defaultTenorDays !== DEFAULT_TENOR_DAYS ||
    defaultAprBps !== DEFAULT_APR_BPS ||
    defaultPenaltyBps !== DEFAULT_PENALTY_BPS
  ) {
    throw new Error(
      `SavingCore personal variant mismatch: grace=${gracePeriod}, tenor=${defaultTenorDays}, apr=${defaultAprBps}, penalty=${defaultPenaltyBps}.`,
    );
  }

  const currentAuthorizedSavingCore = ethers.getAddress(
    await vault.savingCore(),
  );

  const expectedSavingCore = ethers.getAddress(
    coreDeployment.address,
  );

  if (currentAuthorizedSavingCore === ethers.ZeroAddress) {
    const authorizationTransaction =
      await vault.authorizeSavingCore(expectedSavingCore);

    const authorizationReceipt =
      await authorizationTransaction.wait(CONFIRMATIONS);

    if (
      !authorizationReceipt ||
      authorizationReceipt.status !== 1
    ) {
      throw new Error(
        `SavingCore authorization transaction ${authorizationTransaction.hash} did not succeed.`,
      );
    }

    log(
      `Authorized SavingCore ${expectedSavingCore} in transaction ${authorizationTransaction.hash}`,
    );
  } else if (
    currentAuthorizedSavingCore === expectedSavingCore
  ) {
    log(
      `VaultManager already authorizes SavingCore ${expectedSavingCore}; skipping transaction.`,
    );
  } else {
    throw new Error(
      `VaultManager authorizes unexpected SavingCore ${currentAuthorizedSavingCore}; expected ${expectedSavingCore}. Redeployment is required.`,
    );
  }

  const authorizedAfterSetup = ethers.getAddress(
    await vault.savingCore(),
  );

  if (authorizedAfterSetup !== expectedSavingCore) {
    throw new Error(
      `SavingCore authorization mismatch: expected=${expectedSavingCore} actual=${authorizedAfterSetup}.`,
    );
  }

  let planCount = await savingCore.planCount();

  if (planCount === 0n) {
    const createPlanTransaction = await savingCore.createPlan(
      DEFAULT_TENOR_DAYS,
      DEFAULT_APR_BPS,
      DEFAULT_MIN_DEPOSIT,
      DEFAULT_MAX_DEPOSIT,
      DEFAULT_PENALTY_BPS,
      true,
    );

    const createPlanReceipt =
      await createPlanTransaction.wait(CONFIRMATIONS);

    if (!createPlanReceipt || createPlanReceipt.status !== 1) {
      throw new Error(
        `Canonical-plan transaction ${createPlanTransaction.hash} did not succeed.`,
      );
    }

    log(
      `Created canonical plan ID 1 in transaction ${createPlanTransaction.hash}`,
    );

    planCount = await savingCore.planCount();
  }

  if (planCount < 1n) {
    throw new Error(
      `Expected canonical plan ID 1, received planCount=${planCount}.`,
    );
  }

  const plan = (await savingCore.getPlan(
    1n,
  )) as PlanSnapshot;

  if (
    plan.tenorDays !== DEFAULT_TENOR_DAYS ||
    plan.aprBps !== DEFAULT_APR_BPS ||
    plan.minDeposit !== DEFAULT_MIN_DEPOSIT ||
    plan.maxDeposit !== DEFAULT_MAX_DEPOSIT ||
    plan.earlyWithdrawPenaltyBps !== DEFAULT_PENALTY_BPS ||
    !plan.enabled
  ) {
    throw new Error(
      `Plan 1 mismatch: tenor=${plan.tenorDays}, apr=${plan.aprBps}, min=${plan.minDeposit}, max=${plan.maxDeposit}, penalty=${plan.earlyWithdrawPenaltyBps}, enabled=${plan.enabled}.`,
    );
  }

  const [
    depositCount,
    vaultBalance,
    totalReservedInterest,
    availableLiquidity,
    fundingShortfall,
  ] = await Promise.all([
    savingCore.depositCount(),
    vault.vaultBalance(),
    vault.totalReservedInterest(),
    vault.availableLiquidity(),
    vault.fundingShortfall(),
  ]);

  if (
    depositCount !== 0n ||
    vaultBalance !== 0n ||
    totalReservedInterest !== 0n ||
    availableLiquidity !== 0n ||
    fundingShortfall !== 0n
  ) {
    throw new Error(
      `Unexpected initial Sepolia state: deposits=${depositCount}, vaultBalance=${vaultBalance}, reserve=${totalReservedInterest}, available=${availableLiquidity}, shortfall=${fundingShortfall}.`,
    );
  }

  log("SafeBank Sepolia deployment verified.");
  log(`MockUSDC: ${mockDeployment.address}`);
  log(`VaultManager: ${vaultDeployment.address}`);
  log(`SavingCore: ${coreDeployment.address}`);
  log(`Canonical plan ID: 1`);
  log("No demo balances, vault funding, or deposits were created.");
};

deploySepolia.tags = ["SepoliaDeploy"];

export default deploySepolia;