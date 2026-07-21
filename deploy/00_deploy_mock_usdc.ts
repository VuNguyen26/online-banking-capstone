import type { DeployFunction } from "hardhat-deploy/types";

const LOCAL_CHAIN_ID = 31_337n;
const ALLOWED_LOCAL_NETWORKS = new Set(["hardhat", "localhost"]);

const deployMockUSDC: DeployFunction = async function (hre) {
  const { deployments, ethers, getChainId, getNamedAccounts, network } = hre;
  const { deploy, log } = deployments;

  if (!ALLOWED_LOCAL_NETWORKS.has(network.name)) {
    throw new Error(
      `MockUSDC local deployment is disabled on network "${network.name}".`,
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

  const { deployer } = await getNamedAccounts();

  if (!deployer) {
    throw new Error("Named deployer account is not configured.");
  }

  const deployment = await deploy("MockUSDC", {
    from: deployer,
    args: [],
    log: true,
  });

  const deployedCode = await ethers.provider.getCode(deployment.address);

  if (deployedCode === "0x") {
    throw new Error(
      `MockUSDC deployment address ${deployment.address} has no bytecode.`,
    );
  }

  const token = await ethers.getContractAt("MockUSDC", deployment.address);

  const [name, symbol, decimals] = await Promise.all([
    token.name(),
    token.symbol(),
    token.decimals(),
  ]);

  if (
    name !== "Mock USD Coin" ||
    symbol !== "mUSDC" ||
    decimals !== 6n
  ) {
    throw new Error(
      `Unexpected MockUSDC metadata: name=${name}, symbol=${symbol}, decimals=${decimals}.`,
    );
  }

  log(`MockUSDC verified at ${deployment.address}`);
};

deployMockUSDC.tags = ["MockUSDC", "Core", "Local"];

export default deployMockUSDC;