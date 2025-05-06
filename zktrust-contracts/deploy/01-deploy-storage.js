// deploy/01-deploy-storage.js
const { network } = require("hardhat");
const { verify } = require("../utils/verify"); // Optional: for verification

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();
    const chainId = network.config.chainId;

    log("----------------------------------------------------");
    log("Deploying ReviewStorage contract...");

    const args = []; // ReviewStorage constructor takes no arguments now

    const reviewStorage = await deploy("ReviewStorage", {
        from: deployer,
        args: args,
        log: true,
        // waitConfirmations: network.config.blockConfirmations || 1, // Wait for blocks on testnets/mainnet
    });

    log(`ReviewStorage deployed at: ${reviewStorage.address}`);
    log("----------------------------------------------------");

    // Optional: Verify on Basescan if not on a local network
    //   if (chainId !== 31337 && process.env.BASESCAN_API_KEY) {
    //     log("Verifying contract on Basescan...");
    //     await verify(reviewStorage.address, args); // Pass contract address and constructor args
    //     log("Contract verified!");
    //     log("----------------------------------------------------");
    //   }
};

module.exports.tags = ["all", "storage"]; // Tags for running specific deployments