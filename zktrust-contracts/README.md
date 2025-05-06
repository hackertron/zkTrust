# ZKTrust Smart Contracts

This package contains the smart contracts for the ZKTrust decentralized review platform on the Base network. These contracts handle verification of zero-knowledge proofs, storage of verified reviews, and management of the registry of products, reviewers, and services.

## Overview

The contracts are structured as follows:

- **ReviewVerification**: Verifies zero-knowledge proofs to ensure that a reviewer actually had an interaction with the business they are reviewing.
- **ReviewStorage**: Stores verified reviews with metadata, and provides functions to retrieve and manage them.
- **ReviewRegistry**: Manages the registry of products, reviewers, and services, and coordinates interactions between contracts.

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone this repository
2. Install dependencies:

```bash
cd zktrust-contracts
npm install
```

3. Create a `.env` file with your private key and RPC URL (see `.env.example`).

### Compile Contracts

```bash
npm run compile
```

### Run Tests

```bash
npm test
```

### Deploy Contracts

#### Local Development

Start a local Hardhat node:

```bash
npm run node
```

Deploy to the local node:

```bash
npm run deploy:local
```

#### Base Sepolia Testnet

Deploy to the Base Sepolia testnet:

```bash
npm run deploy:base-sepolia
```

## Contract Interaction

### Verification Contract

The `ReviewVerification` contract handles the verification of ZK proofs to ensure that reviews come from real customers.

```javascript
// Verify a proof
await reviewVerification.verifyProof(proof, nullifier, productId);

// Check if a nullifier has been used
const isUsed = await reviewVerification.isNullifierUsed(nullifier);
```

### Storage Contract

The `ReviewStorage` contract manages the storage of verified reviews.

```javascript
// Add a review
await reviewStorage.addReview(productId, content, rating, nullifier, serviceName);

// Get a review
const review = await reviewStorage.getReview(reviewId);

// Get all reviews for a product
const productReviews = await reviewStorage.getProductReviews(productId);
```

### Registry Contract

The `ReviewRegistry` contract provides a higher-level interface for the platform.

```javascript
// Register a product
await reviewRegistry.registerProduct(productId, name, manufacturer);

// Add a service
await reviewRegistry.addService(serviceName, domain);

// Submit a review (handles both verification and storage)
await reviewRegistry.submitReview(proof, nullifier, productId, content, rating, serviceName);
```

## Development

### Project Structure

```
zktrust-contracts/
├── contracts/         # Smart contract source files
├── deploy/            # Deployment scripts
├── scripts/           # Utility scripts
├── test/              # Contract tests
└── README.md          # This file
```

### Export ABIs to Frontend

After deploying contracts, you can export their ABIs to the frontend:

```bash
node scripts/export-abis.js
```

This will copy the ABIs and update contract addresses in the frontend.

## Base Testnet Information

The contracts are currently deployed to the Base Sepolia testnet:

- Network Name: Base Sepolia Testnet
- RPC URL: https://sepolia.base.org
- Chain ID: 84532
- Currency Symbol: ETH
- Block Explorer URL: https://sepolia.basescan.org

Get Base Sepolia testnet ETH from the [Base Faucet](https://www.coinbase.com/faucets/base-ethereum-goerli-faucet).

## License

MIT
