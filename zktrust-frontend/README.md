# ZKTrust Frontend

This is the frontend application for the ZKTrust decentralized review platform that uses ZK Email to verify that reviewers had actual interactions with businesses. The frontend now supports both traditional API-based verification and full blockchain integration with Base.

## Project Overview

The application allows users to:
1. Paste the raw content of a purchase confirmation email
2. Generate a ZK proof using the deployed Blueprint SDK
3. Verify the proof either via API or on the Base blockchain
4. Submit verified reviews and store them securely
5. Browse verified reviews with cryptographic guarantees

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- NPM or Yarn
- MetaMask (for blockchain functionality)

### Installation

1. Clone this repository
2. Navigate to the project directory
3. Install dependencies:

```bash
npm install
# or
yarn install
```

### Running the Development Server

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Blockchain Integration

The application now supports full integration with the Base blockchain, allowing for:

1. **On-chain verification**: Proofs are verified directly on the Base blockchain for maximum transparency
2. **On-chain storage**: Reviews are stored permanently on the blockchain
3. **Decentralized access**: The platform becomes truly decentralized with no central point of failure

### Using the Blockchain Features

1. Connect your MetaMask wallet to the Base Sepolia testnet
2. Visit the `/blockchain` route or click on "Try ZKTrust on Base" on the homepage
3. Generate proofs and submit reviews directly on-chain

### Required MetaMask Setup

1. Add Base Sepolia testnet to MetaMask:
   - Network Name: Base Sepolia Testnet
   - RPC URL: https://sepolia.base.org
   - Chain ID: 84532
   - Currency Symbol: ETH
   - Block Explorer URL: https://sepolia.basescan.org

2. Get Base Sepolia testnet ETH from the [Base Faucet](https://www.coinbase.com/faucets/base-ethereum-goerli-faucet)

## Technical Details

- Built with Next.js and React
- Uses the ZK Email SDK (@zk-email/sdk) for proof generation
- Uses ethers.js for blockchain integration
- Supports both traditional backend and blockchain verification/storage
- The proof generation happens entirely client-side using WebAssembly

## Architecture

```
src/
├── app/               # Next.js app router pages
│   ├── blockchain/    # Blockchain-enabled version of the app
│   └── page.tsx       # Standard version home page
├── components/        # React components
│   ├── wallet/        # Wallet connection components
│   ├── blockchain/    # Blockchain-specific components
│   └── ...            # Other components
├── context/           # React contexts
│   └── Web3Context.tsx # Blockchain context provider
├── hooks/             # Custom React hooks
│   ├── useReviewRegistry.ts # Contract interaction hooks
│   └── useVerification.ts  # ZK proof verification hooks
└── abi/               # Contract ABIs for blockchain integration
```

## Notes

- Proof generation is computationally intensive and can take 30 seconds to a few minutes in the browser
- The blockchain-enabled version is currently deployed to the Base Sepolia testnet
- For production, the contracts would be deployed to Base mainnet