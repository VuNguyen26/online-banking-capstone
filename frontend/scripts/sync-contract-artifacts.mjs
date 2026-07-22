import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { getAddress, Interface, ZeroAddress } from "ethers";

const scriptsDirectory = dirname(fileURLToPath(import.meta.url));
const frontendRoot = resolve(scriptsDirectory, "..");
const repositoryRoot = resolve(frontendRoot, "..");

const metadataPath = resolve(
  repositoryRoot,
  "data/deployments/sepolia.json",
);

const abiPaths = {
  MockUSDC: resolve(
    repositoryRoot,
    "data/abi/contracts/MockUSDC.sol/MockUSDC.json",
  ),
  VaultManager: resolve(
    repositoryRoot,
    "data/abi/contracts/VaultManager.sol/VaultManager.json",
  ),
  SavingCore: resolve(
    repositoryRoot,
    "data/abi/contracts/SavingCore.sol/SavingCore.json",
  ),
};

const outputPath = resolve(
  frontendRoot,
  "src/contracts/generated/contracts.ts",
);

const requiredFunctions = {
  MockUSDC: [
    "name",
    "symbol",
    "decimals",
    "mint",
    "balanceOf",
    "allowance",
    "approve",
  ],
  VaultManager: [
    "token",
    "savingCore",
    "paused",
    "vaultBalance",
    "totalReservedInterest",
    "availableLiquidity",
    "fundingShortfall",
  ],
  SavingCore: [
    "token",
    "vaultManager",
    "paused",
    "planCount",
    "getPlan",
    "depositCount",
    "getDeposit",
    "ownerOf",
    "pendingInterest",
    "interestClaimant",
    "GRACE_PERIOD",
    "BPS_DENOMINATOR",
    "openDeposit",
    "withdrawAtMaturity",
    "earlyWithdraw",
    "manualRenew",
    "autoRenew",
    "claimPendingInterest",
  ],
};

const requiredSignatures = {
  MockUSDC: [
    "name()",
    "symbol()",
    "decimals()",
    "mint(address,uint256)",
    "balanceOf(address)",
    "allowance(address,address)",
    "approve(address,uint256)",
  ],
  VaultManager: [
    "token()",
    "savingCore()",
    "paused()",
    "vaultBalance()",
    "totalReservedInterest()",
    "availableLiquidity()",
    "fundingShortfall()",
  ],
  SavingCore: [
    "token()",
    "vaultManager()",
    "paused()",
    "planCount()",
    "getPlan(uint256)",
    "depositCount()",
    "getDeposit(uint256)",
    "ownerOf(uint256)",
    "pendingInterest(uint256)",
    "interestClaimant(uint256)",
    "GRACE_PERIOD()",
    "BPS_DENOMINATOR()",
    "openDeposit(uint256,uint256)",
    "withdrawAtMaturity(uint256)",
    "earlyWithdraw(uint256)",
    "manualRenew(uint256,uint256)",
    "autoRenew(uint256)",
    "claimPendingInterest(uint256)",
  ],
};

function parseJson(text, label) {
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`Invalid JSON in ${label}`, { cause: error });
  }
}

function validateAbi(contractName, abi) {
  if (!Array.isArray(abi)) {
    throw new Error(`${contractName} ABI must be a JSON array.`);
  }

  const functionNames = new Set(
    abi
      .filter((entry) => entry?.type === "function")
      .map((entry) => entry.name),
  );

  for (const functionName of requiredFunctions[contractName]) {
    if (!functionNames.has(functionName)) {
      throw new Error(
        `${contractName} ABI is missing function ${functionName}.`,
      );
    }
  }

  const contractInterface = new Interface(abi);

  for (const signature of requiredSignatures[contractName]) {
    if (contractInterface.getFunction(signature) === null) {
      throw new Error(
        `${contractName} ABI is missing exact signature ${signature}.`,
      );
    }
  }
}

function validateContractMetadata(metadata, contractName) {
  const contract = metadata.contracts?.[contractName];

  if (!contract) {
    throw new Error(`Missing ${contractName} deployment metadata.`);
  }

  const address = getAddress(contract.address);

  if (address === ZeroAddress) {
    throw new Error(`${contractName} address must not be zero.`);
  }

  if (contract.verified !== true) {
    throw new Error(
      `${contractName} must have verified public deployment metadata.`,
    );
  }

  if (
    !Number.isInteger(contract.deploymentBlockNumber) ||
    contract.deploymentBlockNumber <= 0
  ) {
    throw new Error(
      `${contractName} deployment block number is invalid.`,
    );
  }

  return {
    address,
    deploymentBlockNumber: contract.deploymentBlockNumber,
    explorerUrl: contract.explorerUrl,
    verified: true,
  };
}

const metadata = parseJson(
  await readFile(metadataPath, "utf8"),
  metadataPath,
);

if (metadata.network !== "sepolia") {
  throw new Error(`Expected sepolia metadata, received ${metadata.network}.`);
}

if (metadata.chainId !== 11155111) {
  throw new Error(
    `Expected Sepolia chain ID 11155111, received ${metadata.chainId}.`,
  );
}

const abis = {};

for (const [contractName, abiPath] of Object.entries(abiPaths)) {
  const abi = parseJson(await readFile(abiPath, "utf8"), abiPath);
  validateAbi(contractName, abi);
  abis[contractName] = abi;
}

const deployment = {
  network: "sepolia",
  chainId: 11155111,
  contracts: {
    MockUSDC: validateContractMetadata(metadata, "MockUSDC"),
    VaultManager: validateContractMetadata(metadata, "VaultManager"),
    SavingCore: validateContractMetadata(metadata, "SavingCore"),
  },
};

const generatedSource = `/* This file is generated by scripts/sync-contract-artifacts.mjs.
 * Do not edit it manually.
 * Root deployment metadata and production ABIs are the canonical sources.
 */

export const SAFE_BANK_DEPLOYMENT = ${JSON.stringify(
  deployment,
  null,
  2,
)} as const;

export const MOCK_USDC_ABI = ${JSON.stringify(
  abis.MockUSDC,
  null,
  2,
)} as const;

export const VAULT_MANAGER_ABI = ${JSON.stringify(
  abis.VaultManager,
  null,
  2,
)} as const;

export const SAVING_CORE_ABI = ${JSON.stringify(
  abis.SavingCore,
  null,
  2,
)} as const;
`;

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, generatedSource, "utf8");

console.log("SafeBank frontend contract artifacts synchronized.");
console.log(`Chain ID: ${deployment.chainId}`);

for (const [name, contract] of Object.entries(deployment.contracts)) {
  console.log(
    `${name}: ${contract.address} at block ${contract.deploymentBlockNumber}`,
  );
}

console.log(`Generated: ${outputPath}`);
