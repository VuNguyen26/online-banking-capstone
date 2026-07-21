import hre = require("hardhat");

const LOCAL_CHAIN_ID = 31_337n;
const TOKEN_DECIMALS = 6;

const DEFAULT_TENOR_DAYS = 180n;
const DEFAULT_APR_BPS = 200n;
const DEFAULT_MIN_DEPOSIT = 100n * 10n ** 6n;
const DEFAULT_MAX_DEPOSIT = 10_000n * 10n ** 6n;
const DEFAULT_PENALTY_BPS = 750n;

const EXPECTED_GRACE_PERIOD = 2n * 24n * 60n * 60n;
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

function requireEqualAddress(
  actual: string,
  expected: string,
  label: string,
): void {
  if (hre.ethers.getAddress(actual) !== hre.ethers.getAddress(expected)) {
    throw new Error(
      `${label} mismatch: expected=${expected} actual=${actual}.`,
    );
  }
}

async function main(): Promise<void> {
  const {
    deployments,
    ethers,
    getChainId,
    getNamedAccounts,
    network,
  } = hre;

  if (network.name !== "localhost") {
    throw new Error(
      `Local verification requires network "localhost", received "${network.name}".`,
    );
  }

  const configuredChainId = BigInt(await getChainId());
  const runtimeNetwork = await ethers.provider.getNetwork();

  if (
    configuredChainId !== LOCAL_CHAIN_ID ||
    runtimeNetwork.chainId !== LOCAL_CHAIN_ID
  ) {
    throw new Error(
      `Expected chain ID ${LOCAL_CHAIN_ID}, received configured=${configuredChainId} runtime=${runtimeNetwork.chainId}.`,
    );
  }

  const {
    deployer,
    admin,
    feeReceiver,
    demoUserOne,
    demoUserTwo,
    keeper,
  } = await getNamedAccounts();

  if (
    !deployer ||
    !admin ||
    !feeReceiver ||
    !demoUserOne ||
    !demoUserTwo ||
    !keeper
  ) {
    throw new Error("Required named local accounts are not configured.");
  }

  requireEqualAddress(deployer, admin, "Deployer/admin");

  const normalizedRoles = [
    admin,
    feeReceiver,
    demoUserOne,
    demoUserTwo,
    keeper,
  ].map((address) => ethers.getAddress(address));

  if (new Set(normalizedRoles).size !== normalizedRoles.length) {
    throw new Error(
      "Admin, fee receiver, demo users, and keeper must be distinct.",
    );
  }

  const [
    tokenDeployment,
    vaultDeployment,
    savingCoreDeployment,
  ] = await Promise.all([
    deployments.get("MockUSDC"),
    deployments.get("VaultManager"),
    deployments.get("SavingCore"),
  ]);

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
      "One or more deployment records point to addresses without bytecode.",
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

  const [
    tokenName,
    tokenSymbol,
    decimals,
    vaultToken,
    vaultOwner,
    pendingVaultOwner,
    configuredFeeReceiver,
    authorizedSavingCore,
    savingCoreToken,
    savingCoreVault,
    savingCoreOwner,
    pendingSavingCoreOwner,
    vaultPaused,
    savingCorePaused,
    gracePeriod,
    defaultTenorDays,
    defaultAprBps,
    defaultPenaltyBps,
    planCount,
    depositCount,
    defaultPlanResult,
    demoUserOneBalance,
    demoUserTwoBalance,
    vaultBalance,
    totalReservedInterest,
    availableLiquidity,
    fundingShortfall,
  ] = await Promise.all([
    token.name(),
    token.symbol(),
    token.decimals(),
    vault.token(),
    vault.owner(),
    vault.pendingOwner(),
    vault.feeReceiver(),
    vault.savingCore(),
    savingCore.token(),
    savingCore.vaultManager(),
    savingCore.owner(),
    savingCore.pendingOwner(),
    vault.paused(),
    savingCore.paused(),
    savingCore.GRACE_PERIOD(),
    savingCore.DEFAULT_TENOR_DAYS(),
    savingCore.DEFAULT_APR_BPS(),
    savingCore.DEFAULT_EARLY_WITHDRAW_PENALTY_BPS(),
    savingCore.planCount(),
    savingCore.depositCount(),
    savingCore.getPlan(1n),
    token.balanceOf(demoUserOne),
    token.balanceOf(demoUserTwo),
    vault.vaultBalance(),
    vault.totalReservedInterest(),
    vault.availableLiquidity(),
    vault.fundingShortfall(),
  ]);

  const defaultPlan = defaultPlanResult as DemoPlan;

  if (
    tokenName !== "Mock USD Coin" ||
    tokenSymbol !== "mUSDC" ||
    decimals !== BigInt(TOKEN_DECIMALS)
  ) {
    throw new Error(
      `Unexpected MockUSDC metadata: name=${tokenName}, symbol=${tokenSymbol}, decimals=${decimals}.`,
    );
  }

  requireEqualAddress(
    vaultToken,
    tokenDeployment.address,
    "VaultManager token",
  );

  requireEqualAddress(vaultOwner, admin, "VaultManager owner");

  requireEqualAddress(
    configuredFeeReceiver,
    feeReceiver,
    "VaultManager fee receiver",
  );

  requireEqualAddress(
    authorizedSavingCore,
    savingCoreDeployment.address,
    "Authorized SavingCore",
  );

  requireEqualAddress(
    savingCoreToken,
    tokenDeployment.address,
    "SavingCore token",
  );

  requireEqualAddress(
    savingCoreVault,
    vaultDeployment.address,
    "SavingCore vault",
  );

  requireEqualAddress(
    savingCoreOwner,
    admin,
    "SavingCore owner",
  );

  if (
    ethers.getAddress(pendingVaultOwner) !== ethers.ZeroAddress ||
    ethers.getAddress(pendingSavingCoreOwner) !== ethers.ZeroAddress
  ) {
    throw new Error(
      `Unexpected pending ownership: vault=${pendingVaultOwner} savingCore=${pendingSavingCoreOwner}.`,
    );
  }

  if (vaultPaused || savingCorePaused) {
    throw new Error(
      `Unexpected pause state: vault=${vaultPaused} savingCore=${savingCorePaused}.`,
    );
  }

  if (
    gracePeriod !== EXPECTED_GRACE_PERIOD ||
    defaultTenorDays !== DEFAULT_TENOR_DAYS ||
    defaultAprBps !== DEFAULT_APR_BPS ||
    defaultPenaltyBps !== DEFAULT_PENALTY_BPS
  ) {
    throw new Error(
      `Personal Variant mismatch: grace=${gracePeriod}, tenor=${defaultTenorDays}, apr=${defaultAprBps}, penalty=${defaultPenaltyBps}.`,
    );
  }

  if (planCount < 1n) {
    throw new Error("Canonical plan 1 does not exist.");
  }

  if (
    defaultPlan.tenorDays !== DEFAULT_TENOR_DAYS ||
    defaultPlan.aprBps !== DEFAULT_APR_BPS ||
    defaultPlan.minDeposit !== DEFAULT_MIN_DEPOSIT ||
    defaultPlan.maxDeposit !== DEFAULT_MAX_DEPOSIT ||
    defaultPlan.earlyWithdrawPenaltyBps !== DEFAULT_PENALTY_BPS ||
    !defaultPlan.enabled
  ) {
    throw new Error(
      `Canonical plan mismatch: tenor=${defaultPlan.tenorDays}, apr=${defaultPlan.aprBps}, min=${defaultPlan.minDeposit}, max=${defaultPlan.maxDeposit}, penalty=${defaultPlan.earlyWithdrawPenaltyBps}, enabled=${defaultPlan.enabled}.`,
    );
  }

  if (
    demoUserOneBalance < DEMO_USER_ONE_TARGET ||
    demoUserTwoBalance < DEMO_USER_TWO_TARGET
  ) {
    throw new Error(
      `Demo balances below target: userOne=${demoUserOneBalance}, userTwo=${demoUserTwoBalance}.`,
    );
  }

  if (vaultBalance !== VAULT_TARGET_BALANCE) {
    throw new Error(
      `Vault target mismatch: expected=${VAULT_TARGET_BALANCE} actual=${vaultBalance}.`,
    );
  }

  const expectedAvailableLiquidity =
    vaultBalance > totalReservedInterest
      ? vaultBalance - totalReservedInterest
      : 0n;

  const expectedFundingShortfall =
    totalReservedInterest > vaultBalance
      ? totalReservedInterest - vaultBalance
      : 0n;

  if (
    availableLiquidity !== expectedAvailableLiquidity ||
    fundingShortfall !== expectedFundingShortfall
  ) {
    throw new Error(
      `C2 metric mismatch: balance=${vaultBalance}, reserve=${totalReservedInterest}, available=${availableLiquidity}, shortfall=${fundingShortfall}.`,
    );
  }

  const summary = {
    network: network.name,
    chainId: runtimeNetwork.chainId.toString(),
    contracts: {
      MockUSDC: tokenDeployment.address,
      VaultManager: vaultDeployment.address,
      SavingCore: savingCoreDeployment.address,
    },
    roles: {
      admin,
      feeReceiver,
      demoUserOne,
      demoUserTwo,
      keeper,
    },
    state: {
      planCount: planCount.toString(),
      depositCount: depositCount.toString(),
      demoUserOneBalance: ethers.formatUnits(
        demoUserOneBalance,
        TOKEN_DECIMALS,
      ),
      demoUserTwoBalance: ethers.formatUnits(
        demoUserTwoBalance,
        TOKEN_DECIMALS,
      ),
      vaultBalance: ethers.formatUnits(
        vaultBalance,
        TOKEN_DECIMALS,
      ),
      totalReservedInterest: ethers.formatUnits(
        totalReservedInterest,
        TOKEN_DECIMALS,
      ),
      availableLiquidity: ethers.formatUnits(
        availableLiquidity,
        TOKEN_DECIMALS,
      ),
      fundingShortfall: ethers.formatUnits(
        fundingShortfall,
        TOKEN_DECIMALS,
      ),
    },
  };

  console.log("SafeBank local deployment verification passed.");
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});