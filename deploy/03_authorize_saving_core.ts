import type { DeployFunction } from "hardhat-deploy/types";

const LOCAL_CHAIN_ID = 31_337n;
const ALLOWED_LOCAL_NETWORKS = new Set(["hardhat", "localhost"]);

const authorizeSavingCore: DeployFunction = async function (hre) {
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
      `SavingCore authorization is disabled on network "${network.name}".`,
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

  const { admin } = await getNamedAccounts();

  if (!admin) {
    throw new Error("Named admin account is not configured.");
  }

  const vaultDeployment = await get("VaultManager");
  const savingCoreDeployment = await get("SavingCore");

  const [vaultCode, savingCoreCode] = await Promise.all([
    ethers.provider.getCode(vaultDeployment.address),
    ethers.provider.getCode(savingCoreDeployment.address),
  ]);

  if (vaultCode === "0x") {
    throw new Error(
      `VaultManager deployment ${vaultDeployment.address} has no bytecode.`,
    );
  }

  if (savingCoreCode === "0x") {
    throw new Error(
      `SavingCore deployment ${savingCoreDeployment.address} has no bytecode.`,
    );
  }

  const vault = await ethers.getContractAt(
    "VaultManager",
    vaultDeployment.address,
  );

  const savingCore = await ethers.getContractAt(
    "SavingCore",
    savingCoreDeployment.address,
  );

  const [
    vaultOwner,
    currentAuthorizedSavingCore,
    vaultToken,
    coreToken,
    coreVault,
  ] = await Promise.all([
    vault.owner(),
    vault.savingCore(),
    vault.token(),
    savingCore.token(),
    savingCore.vaultManager(),
  ]);

  if (
    ethers.getAddress(vaultOwner) !==
    ethers.getAddress(admin)
  ) {
    throw new Error(
      `VaultManager owner mismatch: expected=${admin} actual=${vaultOwner}.`,
    );
  }

  if (
    ethers.getAddress(vaultToken) !==
    ethers.getAddress(coreToken)
  ) {
    throw new Error(
      `Token dependency mismatch: VaultManager=${vaultToken} SavingCore=${coreToken}.`,
    );
  }

  if (
    ethers.getAddress(coreVault) !==
    ethers.getAddress(vaultDeployment.address)
  ) {
    throw new Error(
      `SavingCore references unexpected VaultManager ${coreVault}.`,
    );
  }

  const expectedSavingCore = ethers.getAddress(
    savingCoreDeployment.address,
  );

  const configuredSavingCore = ethers.getAddress(
    currentAuthorizedSavingCore,
  );

  if (configuredSavingCore === expectedSavingCore) {
    log(
      `VaultManager already authorizes SavingCore ${expectedSavingCore}; skipping transaction.`,
    );
    return;
  }

  if (configuredSavingCore !== ethers.ZeroAddress) {
    throw new Error(
      `VaultManager already authorizes unexpected SavingCore ${configuredSavingCore}; expected ${expectedSavingCore}. Redeployment is required.`,
    );
  }

  const adminSigner = await ethers.getSigner(admin);
  const connectedVault = vault.connect(adminSigner);

  const transaction = await connectedVault.authorizeSavingCore(
    expectedSavingCore,
  );

  const receipt = await transaction.wait();

  if (!receipt || receipt.status !== 1) {
    throw new Error(
      `SavingCore authorization transaction ${transaction.hash} did not succeed.`,
    );
  }

  const authorizedAfterTransaction = await vault.savingCore();

  if (
    ethers.getAddress(authorizedAfterTransaction) !==
    expectedSavingCore
  ) {
    throw new Error(
      `Authorization verification failed: expected=${expectedSavingCore} actual=${authorizedAfterTransaction}.`,
    );
  }

  log(`VaultManager authorized SavingCore ${expectedSavingCore}`);
};

authorizeSavingCore.tags = [
  "AuthorizeSavingCore",
  "Setup",
  "Local",
];

authorizeSavingCore.dependencies = ["SavingCore"];

export default authorizeSavingCore;