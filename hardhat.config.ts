import { task } from "hardhat/config";
import "@nomicfoundation/hardhat-verify";
import "solidity-coverage";
import "hardhat-contract-sizer";
import "hardhat-abi-exporter";
import "hardhat-gas-reporter";
import * as dotenv from "dotenv";
import "hardhat-deploy";
import "hardhat-deploy-ethers";
import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-chai-matchers";
import "@typechain/hardhat";

dotenv.config();

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

const {
  TESTNET_PRIVATE_KEY: testnetPrivateKey,
  MAINNET_PRIVATE_KEY: mainnetPrivateKey,
  ETHERSCAN_API_KEY: etherscanApiKey,
} = process.env;

const reportGas = process.env.REPORT_GAS;

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  networks: {
    hardhat: {
      chainId: 31337,
      live: false,
      saveDeployments: false,
      tags: ["local", "ephemeral"],
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
      live: false,
      saveDeployments: true,
      tags: ["local", "persistent"],
    },
    sepolia: {
      url: "https://ethereum-sepolia-rpc.publicnode.com",
      accounts: testnetPrivateKey ? [testnetPrivateKey] : [],
      timeout: 40000,
    },
    mainnet: {
      url: "https://eth-mainnet.public.blastapi.io",
      accounts: mainnetPrivateKey ? [mainnetPrivateKey] : [],
      timeout: 60000,
    },
  },

  solidity: {
    compilers: [
      {
        version: "0.8.28",
        settings: {
          optimizer: {
            enabled: true,
            runs: 1000,
          },
          viaIR: true,
        },
      },
    ],
  },

  abiExporter: {
    path: "data/abi",
    runOnCompile: true,
    clear: true,
    flat: false,
    only: [
      ":MockUSDC$",
      ":VaultManager$",
      ":SavingCore$",
    ],
    spacing: 4,
  },

  gasReporter: {
    enabled: reportGas == "1",
  },

  contractSizer: {
    alphaSort: true,
    disambiguatePaths: false,
    runOnCompile: true,
  },

  etherscan: {
    apiKey: etherscanApiKey || "",
  },

  sourcify: {
    // Disabled by default
    // Doesn't need an API key
    enabled: false,
  },

  mocha: {
    timeout: 40000,
  },

  namedAccounts: {
    deployer: {
      default: 0,
    },
    admin: {
      default: 0,
    },
    feeReceiver: {
      default: 1,
    },
    demoUserOne: {
      default: 2,
    },
    demoUserTwo: {
      default: 3,
    },
    keeper: {
      default: 4,
    },
  },

  typechain: {
    outDir: "typechain",
    target: "ethers-v6",
  },
};