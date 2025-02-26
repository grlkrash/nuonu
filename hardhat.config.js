require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config({ path: ".env.local" });
require("@matterlabs/hardhat-zksync-deploy");
require("@matterlabs/hardhat-zksync-solc");
require("@matterlabs/hardhat-zksync-verify");

// Load environment variables
const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000000";
// Remove '0x' prefix if it exists
const NORMALIZED_PRIVATE_KEY = PRIVATE_KEY.startsWith('0x') ? PRIVATE_KEY.substring(2) : PRIVATE_KEY;
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";
const BASESCAN_API_KEY = process.env.BASESCAN_API_KEY || "";
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY || "";

// RPC URLs
const MAINNET_RPC_URL = process.env.MAINNET_RPC_URL || "https://eth-mainnet.g.alchemy.com/v2/your-api-key";
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || "https://eth-sepolia.g.alchemy.com/v2/your-api-key";
const BASE_MAINNET_RPC_URL = process.env.BASE_MAINNET_RPC_URL || "https://mainnet.base.org";
const BASE_SEPOLIA_RPC_URL = process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org";
const ZKSYNC_MAINNET_RPC_URL = process.env.ZKSYNC_MAINNET_RPC_URL || "https://mainnet.era.zksync.io";
const ZKSYNC_TESTNET_RPC_URL = process.env.ZKSYNC_TESTNET_RPC_URL || "https://testnet.era.zksync.dev";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      chainId: 31337,
      forking: {
        url: MAINNET_RPC_URL,
        enabled: false,
      },
    },
    localhost: {
      chainId: 31337,
    },
    mainnet: {
      url: MAINNET_RPC_URL,
      accounts: [NORMALIZED_PRIVATE_KEY],
      chainId: 1,
      saveDeployments: true,
    },
    sepolia: {
      url: SEPOLIA_RPC_URL,
      accounts: [NORMALIZED_PRIVATE_KEY],
      chainId: 11155111,
      saveDeployments: true,
    },
    baseMainnet: {
      url: BASE_MAINNET_RPC_URL,
      accounts: [NORMALIZED_PRIVATE_KEY],
      chainId: 8453,
      saveDeployments: true,
    },
    baseSepolia: {
      url: BASE_SEPOLIA_RPC_URL,
      accounts: [NORMALIZED_PRIVATE_KEY],
      chainId: 84532,
      saveDeployments: true,
    },
    zkSyncMainnet: {
      url: ZKSYNC_MAINNET_RPC_URL,
      accounts: [NORMALIZED_PRIVATE_KEY],
      chainId: 324,
      saveDeployments: true,
    },
    zkSyncTestnet: {
      url: ZKSYNC_TESTNET_RPC_URL,
      accounts: [NORMALIZED_PRIVATE_KEY],
      chainId: 280,
      saveDeployments: true,
      zksync: true,
      ethNetwork: "sepolia"
    },
  },
  etherscan: {
    apiKey: {
      mainnet: ETHERSCAN_API_KEY,
      sepolia: ETHERSCAN_API_KEY,
      baseMainnet: BASESCAN_API_KEY,
      baseSepolia: BASESCAN_API_KEY,
    },
    customChains: [
      {
        network: "baseMainnet",
        chainId: 8453,
        urls: {
          apiURL: "https://api.basescan.org/api",
          browserURL: "https://basescan.org",
        },
      },
      {
        network: "baseSepolia",
        chainId: 84532,
        urls: {
          apiURL: "https://api-sepolia.basescan.org/api",
          browserURL: "https://sepolia.basescan.org",
        },
      },
    ],
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
    outputFile: "gas-report.txt",
    noColors: true,
    coinmarketcap: COINMARKETCAP_API_KEY,
  },
  paths: {
    artifacts: "./src/artifacts",
    cache: "./cache",
    sources: "./src/contracts",
    tests: "./test",
  },
  mocha: {
    timeout: 200000, // 200 seconds max for running tests
  },
}; 