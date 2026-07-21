import type { DeployFunction } from "hardhat-deploy/types";

const LOCAL_CHAIN_ID = 31_337n;
const ALLOWED_LOCAL_NETWORKS = new Set(["hardhat", "localhost"]);

const EXPECTED_GRACE_PERIOD = 2n * 24n * 60n * 60n;
const EXPECTED_DEFAULT_TENOR_DAYS = 180n;
const EXPECTED_DEFAULT_APR_BPS = 200n;
const EXPECTED_DEFAULT_PENALTY_BPS = 750n;

const deploySavingCore: DeployFunction = async function (hre) {
  const {
    deployments,
    ethers,
    getChainId,
    getNamedAccounts,
    network,
  } = hre;

  const { deploy, get, log } = deployments;

  if (!ALLOWED_LOCAL_NETWORKS.has(network.name)) {
    throw new Error(
      `SavingCore local deployment is disabled on network "${network.name}".`,
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
    deployer,
    admin,
  } = await getNamedAccounts();

  if (!deployer || !admin) {
    throw new Error(
      "Named deployer and admin accounts must be configured.",
    );
  }

  if (ethers.getAddress(deployer) !== ethers.getAddress(admin)) {
    throw new Error(
      `Local deployer ${deployer} must match configured admin ${admin}.`,
    );
  }

  const tokenDeployment = await get("MockUSDC");
  const vaultDeployment = await get("VaultManager");

  const [tokenCode, vaultCode] = await Promise.all([
    ethers.provider.getCode(tokenDeployment.address),
    ethers.provider.getCode(vaultDeployment.address),
  ]);

  if (tokenCode === "0x") {
    throw new Error(
      `MockUSDC dependency ${tokenDeployment.address} has no bytecode.`,
    );
  }

  if (vaultCode === "0x") {
    throw new Error(
      `VaultManager dependency ${vaultDeployment.address} has no bytecode.`,
    );
  }

  const deployment = await deploy("SavingCore", {
    from: deployer,
    args: [
      tokenDeployment.address,
      vaultDeployment.address,
      admin,
    ],
    log: true,
  });

  const deployedCode = await ethers.provider.getCode(deployment.address);

  if (deployedCode === "0x") {
    throw new Error(
      `SavingCore deployment address ${deployment.address} has no bytecode.`,
    );
  }

  const savingCore = await ethers.getContractAt(
    "SavingCore",
    deployment.address,
  );

  const [
    configuredToken,
    configuredVault,
    configuredOwner,
    pendingOwner,
    paused,
    gracePeriod,
    defaultTenorDays,
    defaultAprBps,
    defaultPenaltyBps,
    planCount,
    depositCount,
    totalReservedInterest,
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
    savingCore.planCount(),
    savingCore.depositCount(),
    savingCore.totalReservedInterest(),
  ]);

  if (
    ethers.getAddress(configuredToken) !==
    ethers.getAddress(tokenDeployment.address)
  ) {
    throw new Error(
      `SavingCore token mismatch: expected=${tokenDeployment.address} actual=${configuredToken}.`,
    );
  }

  if (
    ethers.getAddress(configuredVault) !==
    ethers.getAddress(vaultDeployment.address)
  ) {
    throw new Error(
      `SavingCore vault mismatch: expected=${vaultDeployment.address} actual=${configuredVault}.`,
    );
  }

  if (
    ethers.getAddress(configuredOwner) !==
    ethers.getAddress(admin)
  ) {
    throw new Error(
      `SavingCore owner mismatch: expected=${admin} actual=${configuredOwner}.`,
    );
  }

  if (ethers.getAddress(pendingOwner) !== ethers.ZeroAddress) {
    throw new Error(
      `SavingCore has unexpected pending owner ${pendingOwner}.`,
    );
  }

  if (paused) {
    throw new Error("SavingCore unexpectedly starts paused.");
  }

  if (
    gracePeriod !== EXPECTED_GRACE_PERIOD ||
    defaultTenorDays !== EXPECTED_DEFAULT_TENOR_DAYS ||
    defaultAprBps !== EXPECTED_DEFAULT_APR_BPS ||
    defaultPenaltyBps !== EXPECTED_DEFAULT_PENALTY_BPS
  ) {
    throw new Error(
      `SavingCore personal variant mismatch: grace=${gracePeriod}, tenor=${defaultTenorDays}, apr=${defaultAprBps}, penalty=${defaultPenaltyBps}.`,
    );
  }

  if (
    deployment.newlyDeployed &&
    (
      planCount !== 0n ||
      depositCount !== 0n ||
      totalReservedInterest !== 0n
    )
  ) {
    throw new Error(
      `Fresh SavingCore has unexpected state: plans=${planCount}, deposits=${depositCount}, reserve=${totalReservedInterest}.`,
    );
  }

  log(`SavingCore verified at ${deployment.address}`);
};

deploySavingCore.tags = ["SavingCore", "Core", "Local"];
deploySavingCore.dependencies = ["MockUSDC", "VaultManager"];

export default deploySavingCore;