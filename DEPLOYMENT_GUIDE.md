# ZKTrust Starknet Deployment Guide

This guide walks through the steps to deploy the ZKTrust Starknet integration to the Sepolia testnet.

## Prerequisites

- Python 3.10 (required for Garaga)
- Rust and Cargo (for compiling Cairo contracts)
- Starkli CLI tool
- Scarb (Cairo package manager)
- A funded Starknet wallet on Sepolia testnet

## Step 1: Setting Up the Environment

### Install Required Tools

1. **Create a Python 3.10 virtual environment**:
   ```bash
   python3.10 -m venv venv
   source venv/bin/activate
   ```

2. **Install Rust and Cargo**:
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   source "$HOME/.cargo/env"
   ```

3. **Install Starkli**:
   ```bash
   # Download from GitHub releases
   curl -L https://github.com/xJonathanLEI/starkli/releases/download/v0.4.0/starkli-aarch64-apple-darwin.tar.gz -o starkli.tar.gz
   tar -xzf starkli.tar.gz
   chmod +x starkli
   ```

4. **Install Scarb**:
   ```bash
   # Download from GitHub releases
   curl -L https://github.com/software-mansion/scarb/releases/download/v2.5.4/scarb-v2.5.4-aarch64-apple-darwin.tar.gz -o scarb.tar.gz
   tar -xzf scarb.tar.gz
   export PATH="$PATH:$(pwd)/scarb/bin"
   ```

## Step 2: Prepare Starknet Account

1. **Create a keystore file**:
   ```bash
   mkdir -p ~/.starkli-wallets/keystore
   tools/starkli signer keystore new ~/.starkli-wallets/keystore/key.json
   ```

2. **Set up environment variables**:
   ```bash
   export STARKNET_ACCOUNT=~/.starkli-wallets/account.json
   export STARKNET_KEYSTORE=~/.starkli-wallets/keystore/key.json
   ```

3. **Create a new account**:
   ```bash
   tools/starkli account oz init ~/.starkli-wallets/account.json
   ```

4. **Fund your account**:
   Get testnet ETH from the [Starknet Sepolia faucet](https://sepolia.starknet.io)

5. **Deploy your account**:
   ```bash
   tools/starkli account deploy --watch ~/.starkli-wallets/account.json
   ```

## Step 3: Compile and Deploy the Contract

1. **Compile the Cairo contract**:
   ```bash
   cd contracts/zktrust_verifier
   scarb build
   ```

2. **Declare the contract class**:
   ```bash
   tools/starkli declare --watch --contract target/dev/zktrust_verifier_ZKTrustVerifier.sierra.json
   ```
   Note down the class hash returned by this command.

3. **Deploy the contract**:
   ```bash
   tools/starkli deploy --watch <CLASS_HASH>
   ```
   Note down the contract address returned by this command.

## Step 4: Update the Frontend Configuration

1. **Create environment file**:
   ```bash
   cd zktrust-frontend
   cp .env.local.example .env.local
   ```

2. **Update contract address**:
   Edit `.env.local` and set `NEXT_PUBLIC_STARKNET_CONTRACT_ADDRESS` to the contract address from the previous step.

## Step 5: Test the Integration

1. **Start the backend**:
   ```bash
   cd zktrust-backend
   npm run dev
   ```

2. **Start the frontend**:
   ```bash
   cd zktrust-frontend
   npm run dev
   ```

3. **Test the verification flow**:
   - Upload an email file
   - Generate a proof
   - Enable Starknet enhanced verification
   - Complete the verification process
   - Check that the review is verified both by the backend and on Starknet

## Troubleshooting

- **Verification Errors**: Check that the contract address is correct in the frontend configuration
- **Transaction Errors**: Ensure your account has enough ETH for transaction fees
- **Compilation Errors**: Make sure you're using the correct versions of Cairo and Scarb
- **Network Issues**: Confirm you're connected to the Sepolia testnet

## Additional Resources

- [Starknet Documentation](https://docs.starknet.io)
- [Starkli Documentation](https://book.starkli.rs)
- [Cairo Documentation](https://book.cairo-lang.org)
