import express from 'express';
import type { Request, Response, RequestHandler } from 'express';
import cors from 'cors';
import zkeSDK, { Proof } from '@zk-email/sdk';
import db from './database'; // Make sure database import is present

// Define interface for the proof verification request
interface VerifyProofRequest {
  proofObject: Proof;
}

// Define interface for the submit review request
interface SubmitReviewRequest {
  proofObject: Proof;
  reviewText: string;
}

// Define interface for the public signals
interface PublicSignal {
  name: string;
  value: string;
}

const app = express();
const PORT = process.env.PORT || 3002;

// --- CORRECTED CORS CONFIGURATION ---
const allowedOrigins = ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003'];

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests) in development
    // or requests from allowed origins
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Ensure OPTIONS is included
  allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'Pragma', 'X-Requested-With'], // Added Cache-Control and others
  credentials: true,
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
};

// Apply CORS middleware globally
app.use(cors(corsOptions));

// --- END OF CORS CONFIGURATION ---

app.use(express.json({ limit: '10mb' }));

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

// Review submission endpoint - replaces simple verification
const submitReview: RequestHandler = async (req: Request, res: Response) => {
  try {
    const { proofObject, reviewText } = req.body as SubmitReviewRequest;

    // Basic validation
    if (!proofObject || !reviewText || typeof reviewText !== 'string' || reviewText.trim() === '') {
      res.status(400).json({ verified: false, message: 'Proof object and review text are required.' });
      return;
    }

    console.log('Received review submission for verification...');

    // --- Nullifier Extraction ---
    const publicSignals = (proofObject as any).publicSignals || [];
    const nullifierSignal = publicSignals.find((s: PublicSignal) => s.name === 'emailNullifier'); // Adjust 'emailNullifier' if the signal name is different

    if (!nullifierSignal?.value) {
      console.error('Email nullifier not found in proof signals.');
      res.status(400).json({ verified: false, message: 'Invalid proof: Nullifier missing.' });
      return;
    }
    const emailNullifier = nullifierSignal.value;
    console.log(`Extracted Nullifier: ${emailNullifier}`);

    // --- Duplicate Check ---
    db.get('SELECT id FROM reviews WHERE emailNullifier = ?', [emailNullifier], async (err, row) => {
      if (err) {
        console.error('Database error during nullifier check:', err.message);
        res.status(500).json({ verified: false, message: 'Database error.' });
        return;
      }
      if (row) {
        console.warn(`Duplicate submission detected for nullifier: ${emailNullifier}`);
        res.status(409).json({ verified: false, message: 'Review already submitted for this purchase email.' });
        return;
      }

      // --- If Nullifier is New, Proceed with Verification ---
      console.log('Nullifier is unique. Proceeding with proof verification...');
      const blueprintId = 'hackertron/GumroadProof@v2'; // Use correct slug
      const sdk = zkeSDK();

      try {
        const blueprint = await sdk.getBlueprint(blueprintId);
        const isValid = await blueprint.verifyProof(proofObject);

        if (!isValid) {
          console.log('Proof verification failed.');
          res.status(400).json({ verified: false, message: 'Proof verification failed.' });
          return;
        }

        console.log('Proof verified successfully!');

        // --- Extract Product Name ---
        let productName = 'Unknown Product';
        const subjectSignal = publicSignals.find((s: PublicSignal) => s.name === 'subject');
        if (subjectSignal?.value) {
          try {
            const subjectArray = JSON.parse(subjectSignal.value);
            if (Array.isArray(subjectArray) && subjectArray.length > 0) {
              productName = subjectArray[0];
            }
          } catch (parseError) { console.error("Failed to parse subject signal:", parseError); }
        }
        console.log(`Verified Product: ${productName}`);

        // --- Save to Database ---
        const insertSql = `
          INSERT INTO reviews (productName, reviewText, isVerified, emailNullifier)
          VALUES (?, ?, ?, ?)
        `;
        db.run(insertSql, [productName, reviewText, true, emailNullifier], function (insertErr) {
          if (insertErr) {
            console.error('Database error during insert:', insertErr.message);
            // Handle potential race condition if nullifier was inserted between check and insert
            if (insertErr.message.includes('UNIQUE constraint failed')) {
              res.status(409).json({ verified: false, message: 'Review already submitted (race condition).' });
              return;
            }
            res.status(500).json({ verified: false, message: 'Failed to save review.' });
            return;
          }
          console.log(`Review saved with ID: ${this.lastID}`);
          res.status(200).json({ 
            success: true, 
            message: 'Review submitted and verified!', 
            productId: this.lastID, 
            productName: productName 
          });
        });

      } catch (verifyError) {
        console.error('Error during proof verification SDK call:', verifyError);
        res.status(500).json({ verified: false, message: 'Error during verification process.' });
      }
    }); // End of db.get callback

  } catch (error) {
    console.error('Outer error handler:', error);
    res.status(500).json({ verified: false, message: 'Internal server error.' });
  }
};

// API endpoint to get all reviews (REMOVED redundant CORS header)
app.get('/api/reviews', (req: Request, res: Response) => {
  const sql = "SELECT id, productName, reviewText, isVerified, createdAt FROM reviews ORDER BY createdAt DESC";
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error("Error fetching reviews:", err.message);
      return res.status(500).json({ error: "Failed to fetch reviews." });
    }
    return res.status(200).json(rows);
  });
});

// Register specific OPTIONS routes for each endpoint instead of using wildcard
app.options('/api/reviews', cors(corsOptions));
app.options('/api/verify-gumroad-proof', cors(corsOptions));
app.options('/api/submit-review', cors(corsOptions));

// Register the route handlers
app.post('/api/verify-gumroad-proof', verifyGumroadProof); // Keep old endpoint for backwards compatibility
app.post('/api/submit-review', submitReview); // New endpoint for review submission

// Start the server
const server = app.listen(PORT, () => {
  console.log(`ZKTrust backend server running on port ${PORT}`);
  console.log(`API endpoints:`);
  console.log(`- Health check: http://localhost:${PORT}/api/health`);
  console.log(`- Verify Gumroad proof: http://localhost:${PORT}/api/verify-gumroad-proof (POST)`);
  console.log(`- Submit review: http://localhost:${PORT}/api/submit-review (POST)`);
  console.log(`- Get reviews: http://localhost:${PORT}/api/reviews (GET)`);
});

// Handle uncaught exceptions and unhandled rejections
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Keep the event loop active to prevent Node from exiting
setInterval(() => {
  // This is an empty interval that keeps the Node.js process running
}, 60000);