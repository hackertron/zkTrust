// deploy/02-deploy-registry.js
const { network, deployments, getNamedAccounts } = require("hardhat");
const { verify } = require("../utils/verify"); // Optional: for verification

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log, get } = deployments; // Add 'get' to retrieve deployments
    const { deployer } = await getNamedAccounts();
    const chainId = network.config.chainId;

    log("----------------------------------------------------");
    log("Deploying ReviewRegistry contract...");

    // Get the deployed ReviewStorage contract address
    const reviewStorageDeployment = await get("ReviewStorage"); // Gets deployment by contract name
    const reviewStorageAddress = reviewStorageDeployment.address;
    log(`Using ReviewStorage at address: ${reviewStorageAddress}`);

    // Arguments for ReviewRegistry constructor: (address _storage)
    const args = [reviewStorageAddress];

    const reviewRegistry = await deploy("ReviewRegistry", {
        from: deployer,
        args: args,
        log: true,
        // waitConfirmations: network.config.blockConfirmations || 1,
    });

    log(`ReviewRegistry deployed at: ${reviewRegistry.address}`);
    log("----------------------------------------------------");

    // Optional: Verify on Basescan
    //   if (chainId !== 31337 && process.env.BASESCAN_API_KEY) {
    //     log("Verifying contract on Basescan...");
    //     await verify(reviewRegistry.address, args);
    //     log("Contract verified!");
    //     log("----------------------------------------------------");
    //   }
};

module.exports.tags = ["all", "registry"];
module.exports.dependencies = ["storage"]; // Ensures storage is deployed first