// hardhat.config.js
require("@nomicfoundation/hardhat-toolbox"); // Includes ethers
require("hardhat-deploy");
require("dotenv").config(); // To load .env file variables

const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || "https://sepolia.base.org";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "0xYourPrivateKeyFallbackHereIfNotSet"; // Add a fallback or ensure it's always set
const BASESCAN_API_KEY = process.env.BASESCAN_API_KEY || "";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20", // Make sure this matches your contracts' pragma
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
    },
    base_sepolia: {
      url: SEPOLIA_RPC_URL,
      accounts: [PRIVATE_KEY], // Your private key from .env
      chainId: 84532, // Base Sepolia Chain ID
      // You might need to specify gas price or other options depending on network conditions
      // gasPrice: 1000000000, // Example: 1 Gwei (optional)
    },
  },
  basescan: {
    // To verify contracts on Basescan
    apiKey: {
      baseSepolia: BASESCAN_API_KEY, // Use your API key from .env
    },
    customChains: [ // Required for Basescan verification through hardhat-etherscan
      {
        network: "baseSepolia",
        chainId: 84532,
        urls: {
          apiURL: "https://api-sepolia.basescan.org/api",
          browserURL: "https://sepolia.basescan.org"
        }
      }
    ]
  },
  namedAccounts: {
    // Used by hardhat-deploy to identify the deployer
    deployer: {
      default: 0, // Uses the first account derived from PRIVATE_KEY
    },
    // Add other accounts if needed, e.g., user: 1
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
    deploy: "./deploy", // Directory for deployment scripts
    deployments: "./deployments", // Directory where deployment info is saved
  },
  mocha: {
    timeout: 40000, // Optional: Increase timeout for tests/scripts
  },
};