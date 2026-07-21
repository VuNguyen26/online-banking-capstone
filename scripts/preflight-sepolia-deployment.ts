import hre from "hardhat";

const SEPOLIA_CHAIN_ID = 11_155_111n;
const BUFFERED_GAS = 5_996_437n;

const EXPECTED_DEPLOYER =
  "0xA998526b0A5F23680f50fa3677f5c6576Dba89d9";

async function main(): Promise<void> {
  const {
    deployments,
    ethers,
    getChainId,
    getNamedAccounts,
    network,
  } = hre;

  if (network.name !== "sepolia") {
    throw new Error(
      `Sepolia preflight is disabled on network "${network.name}".`,
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

  const expectedDeployer = ethers.getAddress(EXPECTED_DEPLOYER);
  const configuredDeployer = ethers.getAddress(deployer);

  if (configuredDeployer !== expectedDeployer) {
    throw new Error(
      `Unexpected named deployer ${configuredDeployer}; expected ${expectedDeployer}.`,
    );
  }

  const signers = await ethers.getSigners();

  if (signers.length !== 1) {
    throw new Error(
      `Expected exactly one configured signer, received ${signers.length}.`,
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

  const [
    balance,
    latestNonce,
    pendingNonce,
    latestBlock,
    feeData,
    existingDeployments,
  ] = await Promise.all([
    ethers.provider.getBalance(expectedDeployer),
    ethers.provider.getTransactionCount(
      expectedDeployer,
      "latest",
    ),
    ethers.provider.getTransactionCount(
      expectedDeployer,
      "pending",
    ),
    ethers.provider.getBlockNumber(),
    ethers.provider.getFeeData(),
    deployments.all(),
  ]);

  if (latestNonce !== pendingNonce) {
    throw new Error(
      `Deployer has pending transactions: latest nonce=${latestNonce}, pending nonce=${pendingNonce}.`,
    );
  }

  const budgetFee =
    feeData.maxFeePerGas ??
    feeData.gasPrice;

  if (budgetFee === null) {
    throw new Error("Provider returned no usable gas fee.");
  }

  const bufferedMaximumCost = BUFFERED_GAS * budgetFee;

  if (balance <= bufferedMaximumCost) {
    throw new Error(
      `Balance ${balance} does not exceed buffered maximum cost ${bufferedMaximumCost}.`,
    );
  }

  const existingDeploymentNames = Object.keys(
    existingDeployments,
  ).sort();

  const expectedDeploymentNames = [
    "MockUSDC",
    "SavingCore",
    "VaultManager",
  ];

  const hasExistingDeployments =
    existingDeploymentNames.length > 0;

  let predictedAddresses: Record<string, string> | null = null;
  let predictedAddressesContainBytecode: boolean | null = null;

  if (hasExistingDeployments) {
    if (
      JSON.stringify(existingDeploymentNames) !==
      JSON.stringify(expectedDeploymentNames)
    ) {
      throw new Error(
        `Unexpected Sepolia deployment records: ${existingDeploymentNames.join(", ")}.`,
      );
    }

    const existingCodes = await Promise.all(
      expectedDeploymentNames.map((name) =>
        ethers.provider.getCode(
          existingDeployments[name].address,
        ),
      ),
    );

    if (existingCodes.some((code) => code === "0x")) {
      throw new Error(
        "One or more recorded Sepolia deployments have no bytecode.",
      );
    }
  } else {
    const predictedMockUSDC = ethers.getCreateAddress({
      from: expectedDeployer,
      nonce: pendingNonce,
    });

    const predictedVaultManager = ethers.getCreateAddress({
      from: expectedDeployer,
      nonce: pendingNonce + 1,
    });

    const predictedSavingCore = ethers.getCreateAddress({
      from: expectedDeployer,
      nonce: pendingNonce + 2,
    });

    predictedAddresses = {
      MockUSDC: predictedMockUSDC,
      VaultManager: predictedVaultManager,
      SavingCore: predictedSavingCore,
    };

    const predictedCodes = await Promise.all([
      ethers.provider.getCode(predictedMockUSDC),
      ethers.provider.getCode(predictedVaultManager),
      ethers.provider.getCode(predictedSavingCore),
    ]);

    predictedAddressesContainBytecode =
      predictedCodes.some((code) => code !== "0x");

    if (predictedAddressesContainBytecode) {
      throw new Error(
        "One or more predicted deployment addresses already contain bytecode.",
      );
    }
  }

  const etherscanApiKeyPresent = Boolean(
    process.env.ETHERSCAN_API_KEY?.trim(),
  );

  if (!etherscanApiKeyPresent) {
    throw new Error(
      "ETHERSCAN_API_KEY is missing from the loaded environment.",
    );
  }

  const result = {
    network: network.name,
    configuredChainId: configuredChainId.toString(),
    runtimeChainId: runtimeNetwork.chainId.toString(),
    latestBlock,
    deployer: expectedDeployer,
    signerCount: signers.length,
    latestNonce,
    pendingNonce,
    balanceEth: ethers.formatEther(balance),
    fee: {
      gasPriceGwei:
        feeData.gasPrice === null
          ? null
          : ethers.formatUnits(
              feeData.gasPrice,
              "gwei",
            ),
      maxFeePerGasGwei:
        feeData.maxFeePerGas === null
          ? null
          : ethers.formatUnits(
              feeData.maxFeePerGas,
              "gwei",
            ),
      maxPriorityFeePerGasGwei:
        feeData.maxPriorityFeePerGas === null
          ? null
          : ethers.formatUnits(
              feeData.maxPriorityFeePerGas,
              "gwei",
            ),
    },
    bufferedGas: BUFFERED_GAS.toString(),
    bufferedMaximumCostEth:
      ethers.formatEther(bufferedMaximumCost),
    balanceExceedsBufferedCost:
      balance > bufferedMaximumCost,
    etherscanApiKeyPresent,
    deploymentMode: hasExistingDeployments
      ? "reuse-existing"
      : "fresh-deployment",
    existingDeploymentRecords:
      existingDeploymentNames,
    predictedAddresses,
    predictedAddressesContainBytecode,
  };

  console.log("SafeBank Sepolia preflight passed.");
  console.log(JSON.stringify(result, null, 2));
  console.log("No transaction was sent.");
}

main().catch((error: unknown) => {
  const message =
    error instanceof Error ? error.message : String(error);

  console.error(message);
  process.exitCode = 1;
});