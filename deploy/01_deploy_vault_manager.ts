import type { DeployFunction } from "hardhat-deploy/types";

const LOCAL_CHAIN_ID = 31_337n;
const ALLOWED_LOCAL_NETWORKS = new Set(["hardhat", "localhost"]);

const deployVaultManager: DeployFunction = async function (hre) {
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
      `VaultManager local deployment is disabled on network "${network.name}".`,
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
    feeReceiver,
  } = await getNamedAccounts();

  if (!deployer || !admin || !feeReceiver) {
    throw new Error(
      "Named deployer, admin, and feeReceiver accounts must be configured.",
    );
  }

  if (ethers.getAddress(deployer) !== ethers.getAddress(admin)) {
    throw new Error(
      `Local deployer ${deployer} must match configured admin ${admin}.`,
    );
  }

  if (ethers.getAddress(feeReceiver) === ethers.ZeroAddress) {
    throw new Error("Configured feeReceiver must not be the zero address.");
  }

  const tokenDeployment = await get("MockUSDC");

  const tokenCode = await ethers.provider.getCode(tokenDeployment.address);

  if (tokenCode === "0x") {
    throw new Error(
      `MockUSDC dependency ${tokenDeployment.address} has no bytecode.`,
    );
  }

  const deployment = await deploy("VaultManager", {
    from: deployer,
    args: [
      tokenDeployment.address,
      admin,
      feeReceiver,
    ],
    log: true,
  });

  const deployedCode = await ethers.provider.getCode(deployment.address);

  if (deployedCode === "0x") {
    throw new Error(
      `VaultManager deployment address ${deployment.address} has no bytecode.`,
    );
  }

  const vault = await ethers.getContractAt(
    "VaultManager",
    deployment.address,
  );

  const [
    configuredToken,
    configuredOwner,
    pendingOwner,
    configuredFeeReceiver,
    configuredSavingCore,
    paused,
  ] = await Promise.all([
    vault.token(),
    vault.owner(),
    vault.pendingOwner(),
    vault.feeReceiver(),
    vault.savingCore(),
    vault.paused(),
  ]);

  if (
    ethers.getAddress(configuredToken) !==
    ethers.getAddress(tokenDeployment.address)
  ) {
    throw new Error(
      `VaultManager token mismatch: expected=${tokenDeployment.address} actual=${configuredToken}.`,
    );
  }

  if (
    ethers.getAddress(configuredOwner) !==
    ethers.getAddress(admin)
  ) {
    throw new Error(
      `VaultManager owner mismatch: expected=${admin} actual=${configuredOwner}.`,
    );
  }

  if (ethers.getAddress(pendingOwner) !== ethers.ZeroAddress) {
    throw new Error(
      `VaultManager has unexpected pending owner ${pendingOwner}.`,
    );
  }

  if (
    ethers.getAddress(configuredFeeReceiver) !==
    ethers.getAddress(feeReceiver)
  ) {
    throw new Error(
      `VaultManager fee receiver mismatch: expected=${feeReceiver} actual=${configuredFeeReceiver}.`,
    );
  }

  if (
    deployment.newlyDeployed &&
    ethers.getAddress(configuredSavingCore) !== ethers.ZeroAddress
  ) {
    throw new Error(
      `Fresh VaultManager unexpectedly authorizes SavingCore ${configuredSavingCore}.`,
    );
  }

  if (paused) {
    throw new Error("VaultManager unexpectedly starts paused.");
  }

  log(`VaultManager verified at ${deployment.address}`);
};

deployVaultManager.tags = ["VaultManager", "Core", "Local"];
deployVaultManager.dependencies = ["MockUSDC"];

export default deployVaultManager;