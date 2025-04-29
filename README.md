# ZKTrust - Decentralized Review Platform

A decentralized review platform powered by zero-knowledge proofs for verified, trustworthy reviews.

## Project Overview

ZKTrust is a trustless review platform similar to Trustpilot, but with enhanced trust mechanisms. The core innovation is using ZK Email to cryptographically verify that a reviewer actually had a specific interaction (like making a purchase) with the business they are reviewing, thus combating fake reviews.

## Monorepo Structure

This project uses a monorepo structure with the following organization:

```
zk-trust-src/
├── zktrust-backend/  # Express API for proof verification
├── zktrust-frontend/ # Next.js frontend application
└── README.md         # This file
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn

### Installation

1. Clone this repository
2. Install dependencies for both projects:

```bash
# Install backend dependencies
cd zktrust-backend
npm install

# Install frontend dependencies
cd ../zktrust-frontend
npm install
```

### Running the Development Environment

Start both the frontend and backend in separate terminal windows:

```bash
# Terminal 1: Start the backend
cd zktrust-backend
npm run dev

# Terminal 2: Start the frontend
cd zktrust-frontend
npm run dev
```

## Frontend (Next.js)

The frontend allows users to:
- Upload Gumroad purchase confirmation emails (.eml)
- Generate ZK proofs using the ZK Email SDK
- Send proofs to the backend for verification
- View verification results with extracted product information

Access the frontend at: http://localhost:3000

## Backend (Express)

The backend provides API endpoints for:
- Verifying ZK proofs generated from Gumroad purchase emails
- Extracting product information from verified proofs

API endpoints:
- Health check: http://localhost:3001/api/health
- Verify proof: http://localhost:3001/api/verify-gumroad-proof (POST)

## Technology Stack

- **Frontend**: Next.js, React, Tailwind CSS, ZK Email SDK
- **Backend**: Express, TypeScript, ZK Email SDK
- **ZK Technology**: ZK Email Blueprint SDK for DKIM signature verification

## Project Status

- **Phase 1**: Email proof generation ✅
- **Phase 2**: Backend proof verification ✅
- **Future Phases**: Review submission, storage, and display
