# ZKTrust Starknet Integration

This document provides instructions for setting up and using the Starknet integration for the ZKTrust platform.

## Overview

The Starknet integration enhances the ZKTrust platform by adding on-chain verification of purchase proofs using Starknet's STARK-based cryptographic guarantees. The integration consists of:

1. Cairo smart contract for verification
2. Frontend integration with Starknet.js
3. Backend support for Starknet verification data
4. Updated UI to display Starknet verification status

## Prerequisites

- Node.js (v18+)
- Python 3.10 (required for Garaga)
- Cairo development tools
- Starknet account with Sepolia testnet ETH for deployment

### Important Network Information

- Starknet now uses **Sepolia** testnet instead of Goerli
- You'll need a funded Starknet account on Sepolia testnet
- You can get testnet tokens from the [Starknet Sepolia faucet](https://sepolia.starknet.io/)
- This implementation uses public RPC nodes from Nethermind for Sepolia

## Setup Instructions

### 1. Install Cairo Development Tools

```bash
# Install Cairo dependencies
brew install gmp

# Install Python dependencies 
pip install fastecdsa
pip install garaga
```

For detailed installation instructions, refer to the [Starknet documentation](https://docs.starknet.io/documentation/getting_started/environment_setup/).

### 2. Environment Setup

#### Frontend Setup

Copy the environment template and configure:

```bash
cd zktrust-frontend
cp .env.local.example .env.local
```

Edit the `.env.local` file to update your settings.

#### Contract Deployment Setup

Copy the environment template for contract deployment:

```bash
cd contracts
cp .env.example .env
```

Edit the `.env` file with your Starknet account information.

### 3. Install Starknet.js

Starknet.js has already been installed in the frontend project. If you need to reinstall:

```bash
cd zktrust-frontend
npm install starknet@next
```

### 4. Build the Cairo Contract

```bash
cd contracts/zktrust_verifier
cairo-compile verifier.cairo --output target/release/zktrust_verifier.json
```

### 5. Test Deployment Connection

Before deploying, test your connection to the Starknet Sepolia testnet:

```bash
cd contracts
npm install dotenv starknet
node test_deployment.js
```

This will verify that your account is properly configured and has enough funds.

### 6. Deploy the Cairo Contract to Testnet

```bash
cd contracts
node deploy.js
```

After successful deployment, the contract address will be saved in `contracts/deployment_info.json`.

### 7. Update Contract Address in Frontend

Update the Starknet contract address in your frontend environment:

```bash
cd zktrust-frontend
```

Edit `.env.local` and update the `NEXT_PUBLIC_STARKNET_CONTRACT_ADDRESS` value with your deployed contract address.

## Usage

1. Run the frontend and backend servers:

```bash
# Terminal 1: Start the backend
cd zktrust-backend
npm run dev

# Terminal 2: Start the frontend
cd zktrust-frontend
npm run dev
```

2. Open the application at http://localhost:3000

3. Upload an email file, generate a proof, and enable the "Use Starknet enhanced verification" toggle.

4. The review will be verified both by the backend and on Starknet.

## Features

### Enhanced Security

Starknet integration provides:

- On-chain verification of purchase proofs
- Cryptographic guarantees using STARKs
- Immutable record of verified purchases

### Verification Flow

1. User uploads an email receipt
2. ZKTrust generates a Zero-Knowledge proof
3. The proof is verified by the backend (off-chain)
4. If the "Use Starknet enhanced verification" option is enabled, the proof is also sent to the Starknet contract for on-chain verification
5. The review is submitted with the Starknet verification status and transaction hash

### UI Enhancements

- Toggle for enabling Starknet verification
- Starknet verification badge for reviews
- Display of Starknet transaction hash for transparency

## Limitations and Future Work

- The current implementation is focused on testnet deployment
- The verification process adds slight latency due to blockchain interaction
- Further optimization is possible for gas efficiency
- Future work could include token-based incentives for verified reviews

## Architecture

```
┌───────────────┐         ┌───────────────┐         ┌───────────────┐
│               │         │               │         │               │
│  ZKTrust      │ ──────▶ │  Starknet     │ ──────▶ │  Ethereum L1  │
│  Application  │         │  Verification │         │  (Optional)   │
│               │ ◀────── │  Layer        │ ◀────── │               │
└───────────────┘         └───────────────┘         └───────────────┘
```

## Troubleshooting

- If you encounter issues with Starknet verification, ensure your Starknet account has sufficient testnet ETH
- Cairo compilation errors may require updating the syntax to match the latest Cairo version
- CORS issues in the backend can be resolved by updating the allowed origins in `server.ts`