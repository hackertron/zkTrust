// utils/verify.js
const { run } = require("hardhat");

const verify = async (contractAddress, args) => {
    console.log("Verifying contract...");
    try {
        await run("verify:verify", {
            address: contractAddress,
            constructorArguments: args,
        });
        console.log(`Contract ${contractAddress} verified successfully!`);
    } catch (e) {
        if (e.message.toLowerCase().includes("already verified")) {
            console.log("Already verified!");
        } else {
            console.log(`Verification failed: ${e}`);
        }
    }
};

module.exports = { verify };