import express from 'express';
import type { Request, Response, RequestHandler } from 'express';
import cors from 'cors';
import zkeSDK, { Proof } from '@zk-email/sdk';

// Define interface for the proof verification request
interface VerifyProofRequest {
  proofObject: Proof;
}

// Define interface for the public signals
interface PublicSignal {
  name: string;
  value: string;
}

// Create Express application
const app = express();
const PORT = process.env.PORT || 3001;

// Configure middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increase limit for large proof objects

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', message: 'ZKTrust backend is running' });
});

// Proof verification endpoint
const verifyGumroadProof: RequestHandler = async (req: Request, res: Response) => {
  try {
    // Get proof object from request body
    const { proofObject } = req.body as VerifyProofRequest;

    // Validate if proof object exists
    if (!proofObject) {
      res.status(400).json({
        verified: false,
        message: 'Proof object is required'
      });
      return; // Return void, not the response
    }

    console.log('Received proof for verification...');

    // Define the blueprint ID (make sure it matches the one used in frontend)
    const blueprintId = 'hackertron/GumroadProof@v2';

    // Initialize the SDK
    console.log('Initializing ZK Email SDK...');
    const sdk = zkeSDK();

    // Get the blueprint
    console.log(`Fetching blueprint: ${blueprintId}`);
    const blueprint = await sdk.getBlueprint(blueprintId);

    // Verify the proof (off-chain)
    console.log('Verifying proof...');
    const isValid = await blueprint.verifyProof(proofObject);

    // If proof is not valid, return error response
    if (!isValid) {
      console.log('Proof verification failed');
      res.status(400).json({
        verified: false,
        message: 'Proof verification failed'
      });
      return; // Return void, not the response
    }

    console.log('Proof verified successfully!');

    // Extract product name from public signals if available
    let productName = 'Unknown Product';

    // Accessing public signals based on the Proof structure
    // Note: This might need adjustment based on the actual Proof structure
    const publicSignals = (proofObject as any).publicSignals || [];
    
    if (Array.isArray(publicSignals)) {
      const subjectSignal = publicSignals.find((s: PublicSignal) => s.name === 'subject');
      
      if (subjectSignal?.value) {
        try {
          const subjectArray = JSON.parse(subjectSignal.value);
          if (Array.isArray(subjectArray) && subjectArray.length > 0) {
            productName = subjectArray[0]; // Extract the actual string
          }
        } catch (parseError) {
          console.error("Failed to parse subject signal:", parseError);
        }
      }
    }

    // Return success response with product name
    res.status(200).json({
      verified: true,
      productName: productName
    });
    // No return statement here

  } catch (error) {
    // Log the error and return a generic error response
    console.error('Error during proof verification:', error);
    res.status(500).json({
      verified: false,
      message: 'Error during verification'
    });
    // No return statement here
  }
};

// Register the route handler
app.post('/api/verify-gumroad-proof', verifyGumroadProof);

// Start the server
app.listen(PORT, () => {
  console.log(`ZKTrust backend server running on port ${PORT}`);
  console.log(`API endpoints:`);
  console.log(`- Health check: http://localhost:${PORT}/api/health`);
  console.log(`- Verify Gumroad proof: http://localhost:${PORT}/api/verify-gumroad-proof (POST)`);
});
