// This script deploys the ZKTrustVerifier contract to Starknet testnet
const { Provider, Account, Contract, json, stark, ec, constants } = require('starknet');
const fs = require('fs');
const path = require('path');

// Configuration for deployment
const network = process.env.NETWORK || 'testnet';
const privateKey = process.env.PRIVATE_KEY; // Private key for the deployer account
const accountAddress = process.env.ACCOUNT_ADDRESS; // Address of the deployer account

if (!privateKey || !accountAddress) {
  console.error('Please set PRIVATE_KEY and ACCOUNT_ADDRESS environment variables');
  process.exit(1);
}

async function main() {
  try {
    console.log(`Deploying to ${network}...`);
    
    // Setup provider based on network
    const provider = new Provider({
      sequencer: {
        network: network === 'mainnet' ? constants.NetworkName.SN_MAIN : constants.NetworkName.SN_GOERLI,
      },
    });
    
    // Setup account
    const account = new Account(provider, accountAddress, privateKey);
    
    // Read contract compiled artifact
    // Note: This assumes you've compiled the contract using Cairo CLI tools
    console.log('Reading compiled contract...');
    const compiledContractPath = path.join(__dirname, 'zktrust_verifier/target/release/zktrust_verifier.json');
    const compiledContract = json.parse(fs.readFileSync(compiledContractPath).toString('ascii'));
    
    // Deploy contract
    console.log('Deploying contract...');
    const deployResponse = await account.deployContract({
      contract: compiledContract,
      constructorCalldata: [],
    });
    
    console.log('Waiting for transaction to be confirmed...');
    await provider.waitForTransaction(deployResponse.transaction_hash);
    
    console.log('Contract deployed successfully!');
    console.log('Contract address:', deployResponse.contract_address);
    console.log('Transaction hash:', deployResponse.transaction_hash);
    
    // Write deployment info to a file for future reference
    const deploymentInfo = {
      network,
      contractAddress: deployResponse.contract_address,
      transactionHash: deployResponse.transaction_hash,
      deployedAt: new Date().toISOString(),
    };
    
    fs.writeFileSync(
      path.join(__dirname, 'deployment_info.json'),
      JSON.stringify(deploymentInfo, null, 2)
    );
    
    console.log('Deployment info saved to deployment_info.json');
    
  } catch (error) {
    console.error('Error during deployment:', error);
    process.exit(1);
  }
}

main();