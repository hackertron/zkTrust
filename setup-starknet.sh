#!/bin/bash

# Exit on error
set -e

echo "ZKTrust Starknet Integration Setup"
echo "=================================="
echo

# Check prerequisites
echo "Checking prerequisites..."
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed. Please install Node.js v18 or higher."
    exit 1
fi

if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is not installed. Please install Python 3.10."
    exit 1
fi

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd zktrust-frontend
npm install starknet@next starknet-devnet
cd ..

# Create directories for Cairo development
echo "Setting up Cairo development environment..."
mkdir -p contracts/zktrust_verifier/target/release

# Check for Cairo installation
if ! command -v cairo-compile &> /dev/null; then
    echo "Warning: Cairo compiler not found."
    echo "Please install Cairo development tools using instructions at:"
    echo "https://docs.starknet.io/documentation/getting_started/environment_setup/"
    echo
    echo "Then run the following commands to install Garaga dependencies:"
    echo "pip install fastecdsa"
    echo "pip install garaga"
fi

# Create environment file for deployment
echo "Creating .env file for deployment..."
cat > contracts/.env <<EOF
# Starknet Deployment Configuration
# Replace with your own values before deploying

# Network: testnet or mainnet
NETWORK=testnet

# Private key for the deployer account (without '0x' prefix)
PRIVATE_KEY=your_private_key_here

# Account address (with '0x' prefix)
ACCOUNT_ADDRESS=your_account_address_here
EOF

echo "Setup complete!"
echo
echo "Next steps:"
echo "1. Install Cairo compiler if not already installed"
echo "2. Compile the contract: cd contracts/zktrust_verifier && cairo-compile verifier.cairo --output target/release/zktrust_verifier.json"
echo "3. Update deployment configuration in contracts/.env"
echo "4. Deploy the contract: cd contracts && node deploy.js"
echo "5. Update the contract address in zktrust-frontend/src/components/ProofGenerator.tsx"
echo "6. Start the application: npm run dev (in both frontend and backend directories)"
echo
echo "For more detailed instructions, see README-STARKNET.md"
