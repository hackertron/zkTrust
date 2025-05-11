# ZKTrust - Decentralized Review Platform

A decentralized review platform powered by zero-knowledge proofs for verified, trustworthy reviews.

## Project Overview

ZKTrust is a trustless review platform similar to Trustpilot, but with enhanced trust mechanisms. The core innovation is using ZK Email to cryptographically verify that a reviewer actually had a specific interaction (like making a purchase) with the business they are reviewing, thus combating fake reviews.

## Monorepo Structure

This project uses a monorepo structure with the following organization:

```
zk-trust-src/
├── zktrust-backend/    # Express API for proof verification
├── zktrust-contracts/  # Smart contracts for Base integration
├── zktrust-frontend/   # Next.js frontend application
└── README.md           # This file
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn
- MetaMask browser extension (for blockchain interactions)

### Installation

1. Clone this repository
2. Install dependencies for all projects:

```bash
# Install backend dependencies
cd zktrust-backend
npm install

# Install frontend dependencies
cd ../zktrust-frontend
npm install

# Install smart contract dependencies
cd ../zktrust-contracts
npm install
```

### Running the Development Environment

Start all components in separate terminal windows:

```bash
# Terminal 1: Start the backend
cd zktrust-backend
npm run dev

# Terminal 2: Start the frontend
cd zktrust-frontend
npm run dev

# Terminal 3: Start a local blockchain (optional)
cd zktrust-contracts
npm run node
```

## Frontend (Next.js)

The frontend allows users to:
- Upload Gumroad purchase confirmation emails (.eml)
- Generate ZK proofs using the ZK Email SDK
- Connect their Ethereum wallet (MetaMask)
- Submit verified reviews on-chain
- View verification results with extracted product information

Access the frontend at: http://localhost:3000

## Backend (Express)

The backend provides API endpoints for:
- Verifying ZK proofs generated from Gumroad purchase emails
- Extracting product information from verified proofs
- Managing review submission and retrieval

API endpoints:
- Health check: http://localhost:3002/api/health
- Verify proof: http://localhost:3002/api/verify-gumroad-proof (POST)
- Submit review: http://localhost:3002/api/submit-review (POST)
- Get reviews: http://localhost:3002/api/reviews (GET)

## Smart Contracts (Base Testnet)

The project includes smart contracts for the Base testnet (Sepolia):

- **ReviewVerification**: Verifies zero-knowledge proofs on-chain
- **ReviewStorage**: Stores verified reviews and their metadata
- **ReviewRegistry**: Manages products, reviewers, and services

To compile and deploy the contracts:

```bash
# Compile contracts
cd zktrust-contracts
npm run compile

# Deploy to local node
npm run deploy:local

# Deploy to Base Sepolia testnet
npm run deploy:base-sepolia
```

## Technology Stack

- **Frontend**: Next.js, React, Tailwind CSS, ZK Email SDK, ethers.js
- **Backend**: Express, TypeScript, SQLite, ZK Email SDK
- **Smart Contracts**: Solidity, Hardhat, Base (Layer 2)
- **ZK Technology**: ZK Email Blueprint SDK for DKIM signature verification

## Project Status

- **Phase 1**: Email proof generation ✅
- **Phase 2**: Backend proof verification ✅
- **Phase 3**: Smart contract implementation ✅
- **Phase 4**: On-chain review storage and verification ✅
- **Phase 5**: Decentralized review platform launch 🔜

## Integration with Base

This project integrates with Base, a Layer 2 Ethereum scaling solution developed by Coinbase. The Base integration enables:

1. **On-chain verification of email proofs**: Cryptographically verify that reviewers had legitimate interactions with businesses.
2. **Trustless review storage**: Store verified reviews on-chain for maximum transparency and censorship resistance.
3. **Decentralized reputation system**: Build a reputation system for both reviewers and businesses.

To use the Base integration, ensure you have:
- MetaMask installed with Base Sepolia testnet configured
- Base Sepolia ETH for gas (available from the [Base Faucet](https://www.coinbase.com/faucets/base-ethereum-goerli-faucet))
