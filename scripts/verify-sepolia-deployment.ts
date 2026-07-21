import hre from "hardhat";

const SEPOLIA_CHAIN_ID = 11_155_111n;

const EXPECTED_DEPLOYER =
  "0xA998526b0A5F23680f50fa3677f5c6576Dba89d9";

const TOKEN_DECIMALS = 6;
const DEFAULT_TENOR_DAYS = 180n;
const DEFAULT_APR_BPS = 200n;
const DEFAULT_MIN_DEPOSIT = 100n * 10n ** 6n;
const DEFAULT_MAX_DEPOSIT = 10_000n * 10n ** 6n;
const DEFAULT_PENALTY_BPS = 750n;
const EXPECTED_GRACE_PERIOD = 2n * 24n * 60n * 60n;

type PlanSnapshot = {
  tenorDays: bigint;
  aprBps: bigint;
  minDeposit: bigint;
  maxDeposit: bigint;
  earlyWithdrawPenaltyBps: bigint;
  enabled: boolean;
};

async function main(): Promise<void> {
  const {
    deployments,
    ethers,
    getNamedAccounts,
    network,
  } = hre;

  if (network.name !== "sepolia") {
    throw new Error(
      `Sepolia verification is disabled on network "${network.name}".`,
    );
  }

  const runtimeNetwork = await ethers.provider.getNetwork();

  if (runtimeNetwork.chainId !== SEPOLIA_CHAIN_ID) {
    throw new Error(
      `Expected Sepolia chain ID ${SEPOLIA_CHAIN_ID}, received ${runtimeNetwork.chainId}.`,
    );
  }

  const { deployer } = await getNamedAccounts();

  if (!deployer) {
    throw new Error("Named deployer account is not configured.");
  }

  const expectedDeployer = ethers.getAddress(EXPECTED_DEPLOYER);
  const configuredDeployer = ethers.getAddress(deployer);

  if (configuredDeployer !== expectedDeployer) {
    throw new Error(
      `Unexpected deployer ${configuredDeployer}; expected ${expectedDeployer}.`,
    );
  }

  const [
    mockDeployment,
    vaultDeployment,
    coreDeployment,
  ] = await Promise.all([
    deployments.get("MockUSDC"),
    deployments.get("VaultManager"),
    deployments.get("SavingCore"),
  ]);

  const [mockCode, vaultCode, coreCode] = await Promise.all([
    ethers.provider.getCode(mockDeployment.address),
    ethers.provider.getCode(vaultDeployment.address),
    ethers.provider.getCode(coreDeployment.address),
  ]);

  if (
    mockCode === "0x" ||
    vaultCode === "0x" ||
    coreCode === "0x"
  ) {
    throw new Error(
      "One or more Sepolia deployment addresses have no bytecode.",
    );
  }

  const token = await ethers.getContractAt(
    "MockUSDC",
    mockDeployment.address,
  );

  const vault = await ethers.getContractAt(
    "VaultManager",
    vaultDeployment.address,
  );

  const savingCore = await ethers.getContractAt(
    "SavingCore",
    coreDeployment.address,
  );

  const [
    tokenName,
    tokenSymbol,
    tokenDecimals,
    vaultToken,
    vaultOwner,
    vaultPendingOwner,
    feeReceiver,
    authorizedSavingCore,
    vaultPaused,
    coreToken,
    coreVault,
    coreOwner,
    corePendingOwner,
    corePaused,
    gracePeriod,
    defaultTenorDays,
    defaultAprBps,
    defaultPenaltyBps,
    planCount,
    depositCount,
    vaultBalance,
    tokenBalanceAtVault,
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
    vault.paused(),
    savingCore.token(),
    savingCore.vaultManager(),
    savingCore.owner(),
    savingCore.pendingOwner(),
    savingCore.paused(),
    savingCore.GRACE_PERIOD(),
    savingCore.DEFAULT_TENOR_DAYS(),
    savingCore.DEFAULT_APR_BPS(),
    savingCore.DEFAULT_EARLY_WITHDRAW_PENALTY_BPS(),
    savingCore.planCount(),
    savingCore.depositCount(),
    vault.vaultBalance(),
    token.balanceOf(vaultDeployment.address),
    vault.totalReservedInterest(),
    vault.availableLiquidity(),
    vault.fundingShortfall(),
  ]);

  if (
    tokenName !== "Mock USD Coin" ||
    tokenSymbol !== "mUSDC" ||
    tokenDecimals !== BigInt(TOKEN_DECIMALS)
  ) {
    throw new Error(
      `MockUSDC metadata mismatch: name=${tokenName}, symbol=${tokenSymbol}, decimals=${tokenDecimals}.`,
    );
  }

  if (
    ethers.getAddress(vaultToken) !==
      ethers.getAddress(mockDeployment.address) ||
    ethers.getAddress(coreToken) !==
      ethers.getAddress(mockDeployment.address)
  ) {
    throw new Error("MockUSDC dependency mismatch.");
  }

  if (
    ethers.getAddress(coreVault) !==
    ethers.getAddress(vaultDeployment.address)
  ) {
    throw new Error(
      `SavingCore references unexpected VaultManager ${coreVault}.`,
    );
  }

  if (
    ethers.getAddress(vaultOwner) !== expectedDeployer ||
    ethers.getAddress(coreOwner) !== expectedDeployer
  ) {
    throw new Error(
      `Owner mismatch: vault=${vaultOwner}, core=${coreOwner}, expected=${expectedDeployer}.`,
    );
  }

  if (
    ethers.getAddress(vaultPendingOwner) !== ethers.ZeroAddress ||
    ethers.getAddress(corePendingOwner) !== ethers.ZeroAddress
  ) {
    throw new Error(
      `Unexpected pending owner: vault=${vaultPendingOwner}, core=${corePendingOwner}.`,
    );
  }

  if (ethers.getAddress(feeReceiver) !== expectedDeployer) {
    throw new Error(
      `Fee receiver mismatch: expected=${expectedDeployer}, actual=${feeReceiver}.`,
    );
  }

  if (
    ethers.getAddress(authorizedSavingCore) !==
    ethers.getAddress(coreDeployment.address)
  ) {
    throw new Error(
      `Authorized SavingCore mismatch: expected=${coreDeployment.address}, actual=${authorizedSavingCore}.`,
    );
  }

  if (vaultPaused || corePaused) {
    throw new Error(
      `Unexpected pause state: vault=${vaultPaused}, core=${corePaused}.`,
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
    throw new Error(
      `Canonical plan ID 1 is missing; planCount=${planCount}.`,
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
      `Canonical plan mismatch: tenor=${plan.tenorDays}, apr=${plan.aprBps}, min=${plan.minDeposit}, max=${plan.maxDeposit}, penalty=${plan.earlyWithdrawPenaltyBps}, enabled=${plan.enabled}.`,
    );
  }

  if (vaultBalance !== tokenBalanceAtVault) {
    throw new Error(
      `Vault balance mismatch: getter=${vaultBalance}, tokenBalance=${tokenBalanceAtVault}.`,
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

  const result = {
    network: network.name,
    chainId: runtimeNetwork.chainId.toString(),
    deployer: expectedDeployer,
    contracts: {
      MockUSDC: mockDeployment.address,
      VaultManager: vaultDeployment.address,
      SavingCore: coreDeployment.address,
    },
    ownership: {
      VaultManager: vaultOwner,
      SavingCore: coreOwner,
      feeReceiver,
      authorizedSavingCore,
    },
    paused: {
      VaultManager: vaultPaused,
      SavingCore: corePaused,
    },
    personalVariant: {
      gracePeriodSeconds: gracePeriod.toString(),
      defaultTenorDays: defaultTenorDays.toString(),
      defaultAprBps: defaultAprBps.toString(),
      defaultPenaltyBps: defaultPenaltyBps.toString(),
    },
    canonicalPlan: {
      planId: "1",
      tenorDays: plan.tenorDays.toString(),
      aprBps: plan.aprBps.toString(),
      minDeposit: plan.minDeposit.toString(),
      maxDeposit: plan.maxDeposit.toString(),
      earlyWithdrawPenaltyBps:
        plan.earlyWithdrawPenaltyBps.toString(),
      enabled: plan.enabled,
    },
    state: {
      planCount: planCount.toString(),
      depositCount: depositCount.toString(),
      vaultBalance: vaultBalance.toString(),
      totalReservedInterest:
        totalReservedInterest.toString(),
      availableLiquidity: availableLiquidity.toString(),
      fundingShortfall: fundingShortfall.toString(),
    },
  };

  console.log(
    "SafeBank Sepolia deployment verification passed.",
  );

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error: unknown) => {
  const message =
    error instanceof Error ? error.message : String(error);

  console.error(message);
  process.exitCode = 1;
});