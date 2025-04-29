# ZK Review Frontend

This is a frontend application for a decentralized review platform that uses ZK Email to verify that reviewers had actual interactions with businesses. 

## Project Overview

The application allows users to paste the raw content of a Gumroad purchase confirmation email and generate a ZK proof using the deployed Blueprint SDK. This proof cryptographically verifies that the user received a valid email from the Gumroad domain without revealing the sensitive content of the email.

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- NPM or Yarn

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

## Usage

1. Obtain a raw Gumroad purchase confirmation email (save as .eml or view source in your email client)
2. Copy the entire raw email content
3. Paste the content into the textarea on the application
4. Click the "Generate Gumroad Proof" button
5. Wait for the proof generation to complete (this may take 30 seconds to a few minutes)
6. The generated proof will be displayed on the page

## Technical Details

- Built with Next.js and React
- Uses the ZK Email SDK (@zk-email/sdk) for proof generation
- The proof generation happens entirely client-side using WebAssembly
- The blueprint used is `hackertron/gumroad_purchase_proof` which is configured to:
  - Verify DKIM signatures from customers.gumroad.com
  - Skip the email body hash check
  - Extract the Subject line from the email header as a public output

## Notes

- Proof generation is computationally intensive and can take 30 seconds to a few minutes in the browser
- This is Phase 1 of the project, focusing only on proof generation. Verification and review submission will be part of future phases.