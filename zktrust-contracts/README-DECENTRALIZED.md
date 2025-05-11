# ZKTrust Decentralized Review Platform

This document explains the decentralized architecture for the ZKTrust review platform on Base Sepolia.

## Overview

The ZKTrust platform has been redesigned to be truly decentralized, allowing any user with a valid proof to submit reviews without requiring authorization or permission.

## Key Changes

### 1. Removed Authorization Restrictions

The original contracts required wallets to be explicitly approved as "operators" before they could submit reviews. The redesigned contracts have eliminated these permission checks, allowing any user to submit reviews as long as they can provide a valid zero-knowledge proof.

### 2. Maintained Verification Integrity

While removing permission restrictions, the platform still maintains its core verification mechanism:
- Reviews require valid zero-knowledge proofs of purchase
- Nullifiers prevent duplicate reviews
- The verification process ensures only legitimate reviews are submitted

### 3. Contracts Updated

Three main contracts have been updated:

1. **ReviewVerification.sol**
   - Removed the `onlyOperatorOrOwner` modifier
   - Made proof verification accessible to anyone
   - Maintains nullifier tracking to prevent duplicates

2. **ReviewStorage.sol**
   - Removed authorization checks for adding reviews
   - Simplified the review submission process

3. **ReviewRegistry.sol**
   - Removed permission controls
   - Allow automatic product registration
   - Maintains statistics for products and reviewers

## Deployment

The updated contracts can be deployed using:

```bash
npm run deploy:decentralized
```

This will deploy all contracts to Base Sepolia and output the new contract addresses for frontend integration.

## Usage

After deployment, update your frontend constants with the new contract addresses. Any user can then submit reviews as long as they:

1. Generate a valid zero-knowledge proof of purchase
2. Call the `submitReview` function with the proof and review data

No explicit authorization is required, making the platform truly decentralized.

## Benefits

- **Permissionless**: Any user can submit reviews without needing authorization
- **Self-Sovereign**: Users maintain control of their data and reviews
- **Scalable**: The platform can grow organically without administrative bottlenecks
- **Trustworthy**: All reviews are still backed by cryptographic proofs of purchase

These changes make ZKTrust a truly decentralized review platform while maintaining its zero-knowledge verification mechanism.
