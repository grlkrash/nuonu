import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.17",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    // Base Goerli (testnet)
    "base-goerli": {
      url: process.env.BASE_GOERLI_RPC || "https://goerli.base.org",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      verify: {
        etherscan: {
          apiUrl: "https://api-goerli.basescan.org"
        }
      }
    },
    // zkSync Era Testnet
    "zksync-testnet": {
      url: process.env.ZKSYNC_TESTNET_RPC || "https://testnet.era.zksync.dev",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      verify: {
        etherscan: {
          apiUrl: "https://zksync2-testnet.zkscan.io"
        }
      }
    },
    // Local network for testing
    hardhat: {
      chainId: 1337
    }
  },
  paths: {
    sources: "./src/contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./src/artifacts"
  }
};

export default config; 