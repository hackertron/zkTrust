// Script to test deployment of ZKTrustVerifier contract to Starknet Sepolia testnet
const { RpcProvider, Account, json } = require('starknet');
require('dotenv').config();

async function main() {
  try {
    // Get private key and account address from environment variables
    const privateKey = process.env.PRIVATE_KEY;
    const accountAddress = process.env.ACCOUNT_ADDRESS;

    if (!privateKey || !accountAddress) {
      console.error('Error: PRIVATE_KEY and ACCOUNT_ADDRESS environment variables must be set');
      process.exit(1);
    }

    console.log('Testing deployment to Starknet Sepolia testnet...');

    // Initialize provider with Sepolia RPC endpoint
    const provider = new RpcProvider({
      nodeUrl: 'https://free-rpc.nethermind.io/sepolia-juno/v0_7',
    });

    // Initialize account with the private key and address
    const account = new Account(provider, accountAddress, privateKey);

    // Get chain ID to verify connection
    try {
      const chainId = await provider.getChainId();
      console.log('Connected to Starknet network with chain ID:', chainId);
    } catch (error) {
      console.error('Error connecting to Starknet network:', error);
      process.exit(1);
    }

    // Get account balance to make sure we have enough funds for deployment
    try {
      const balance = await provider.getBalance(accountAddress);
      console.log('Account balance:', balance);
      
      if (BigInt(balance.balance) === 0n) {
        console.warn('Warning: Account balance is zero. You need funds to deploy contracts.');
        console.warn('You can get testnet tokens from the Starknet Sepolia faucet.');
      }
    } catch (error) {
      console.error('Error getting account balance:', error);
    }

    console.log('Account setup successful. Ready to deploy contract.');
    console.log('Account address:', accountAddress);
    
    // Actual deployment would be done using the deploy.js script
    console.log('\nTo deploy the contract, run:');
    console.log('  node deploy.js');

  } catch (error) {
    console.error('Error during deployment test:', error);
    process.exit(1);
  }
}

main();