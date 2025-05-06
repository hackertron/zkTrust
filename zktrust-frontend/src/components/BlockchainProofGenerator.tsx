'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import zkeSDK, { Proof, Blueprint } from '@zk-email/sdk';
import { ethers, keccak256, toUtf8Bytes } from 'ethers';
import StarRatingInput from './StarRatingInput';
import BlockchainStatus from './blockchain/BlockchainStatus';
import { useWeb3 } from '@/context/Web3Context';
import { useReviewRegistry } from '@/hooks/useReviewRegistry';
import { API_URL, BASE_SEPOLIA_CHAIN_ID } from '@/config/constants';

// Define verification status type
type VerificationStatus = 'idle' | 'verifying' | 'verified' | 'failed';

// Define submission status type
type SubmissionStatus = 'idle' | 'submitting' | 'submitted' | 'failed';

// Define verification mode type
type VerificationMode = 'offchain' | 'blockchain';

// Define supported blueprints
const supportedBlueprints = [
  { name: 'Gumroad Purchase', id: 'hackertron/GumroadProof@v2' },
  { name: 'Anthropic Service', id: 'hackertron/AnthropicClaude@v1' },
];

// Define proof generation phases
const PROOF_PHASES = [
  'Initializing circuits...',
  'Generating cryptographic parameters...',
  'Preparing email data...',
  'Building constraint system...',
  'Computing witness...',
  'Generating proof...',
  'Finalizing verification...'
];

const BlockchainProofGenerator = () => {
  // Web3 context
  const { active, account, chainId } = useWeb3();
  const { submitReview: submitReviewToContract, isSubmitting: isSubmittingReview } = useReviewRegistry();

  // State variables
  const [emailContent, setEmailContent] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [proofResult, setProofResult] = useState<Proof | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Blueprint selection state
  const [selectedBlueprintId, setSelectedBlueprintId] = useState<string>(supportedBlueprints[0].id);
  const [blueprintInstance, setBlueprintInstance] = useState<Blueprint | null>(null);

  // Verification state
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('idle');
  const [verifiedProductName, setVerifiedProductName] = useState<string | null>(null);

  // Verification mode
  const [verificationMode, setVerificationMode] = useState<VerificationMode>('offchain');

  // Review submission state
  const [reviewText, setReviewText] = useState<string>('');
  const [rating, setRating] = useState<number>(0);
  const [submissionStatus, setSubmissionStatus] = useState<SubmissionStatus>('idle');
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [submissionSuccess, setSubmissionSuccess] = useState<boolean>(false);

  // Progress bar state
  const [progress, setProgress] = useState<number>(0);
  const [currentPhase, setCurrentPhase] = useState<string>(PROOF_PHASES[0]);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // File input reference
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if blockchain is ready
  const isBlockchainReady = active && chainId === BASE_SEPOLIA_CHAIN_ID;

  // Update verification mode based on blockchain state
  useEffect(() => {
    if (!isBlockchainReady && verificationMode === 'blockchain') {
      setVerificationMode('offchain');
    }
  }, [isBlockchainReady, verificationMode]);

  // Automatically verify proof when it's generated
  useEffect(() => {
    const verifyProof = async () => {
      if (proofResult) {
        if (verificationMode === 'blockchain') {
          await verifyProofWithSDK(proofResult);
        } else {
          await verifyProofWithBackend(proofResult);
        }
      }
    };
    verifyProof();
  }, [proofResult, verificationMode, blueprintInstance]);

  // Progress simulation effect
  useEffect(() => {
    if (isLoading) {
      setProgress(0);
      setCurrentPhase(PROOF_PHASES[0]);
      startTimeRef.current = Date.now();

      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }

      progressIntervalRef.current = setInterval(() => {
        setProgress(prevProgress => {
          const elapsedSeconds = (Date.now() - startTimeRef.current) / 1000;
          let newProgress;

          if (prevProgress < 20) {
            newProgress = Math.min(20, prevProgress + 3);
          } else if (prevProgress < 50) {
            newProgress = Math.min(50, prevProgress + 1.5);
          } else if (prevProgress < 75) {
            newProgress = Math.min(75, prevProgress + 0.8);
          } else {
            newProgress = Math.min(90, prevProgress + 0.3);
          }

          const phaseIndex = Math.min(
            Math.floor(newProgress / (90 / PROOF_PHASES.length)),
            PROOF_PHASES.length - 1
          );
          setCurrentPhase(PROOF_PHASES[phaseIndex]);

          return newProgress;
        });
      }, 1000);

      return () => {
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
      };
    } else if (proofResult) {
      setProgress(100);
      setCurrentPhase('Proof generated successfully!');

      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    } else {
      setProgress(0);

      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    }
  }, [isLoading, proofResult]);

  // File handling functions
  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const processFile = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.eml')) {
      setError('Please upload a valid .eml file');
      return;
    }

    try {
      const content = await file.text();
      setEmailContent(content);
      setFileName(file.name);
      setError(null);

      setVerificationStatus('idle');
      setVerifiedProductName(null);

      setSubmissionStatus('idle');
      setSubmissionError(null);
      setSubmissionSuccess(false);
      setReviewText('');
      setRating(0);
    } catch (err) {
      setError(`Failed to read file: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setEmailContent('');
      setFileName('');
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      await processFile(file);
    }
  }, [processFile]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      await processFile(file);
    }
  }, [processFile]);

  const handleSelectClick = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  const handleClearFile = useCallback(() => {
    setEmailContent('');
    setFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    setVerificationStatus('idle');
    setVerifiedProductName(null);
    setProofResult(null);

    setSubmissionStatus('idle');
    setSubmissionError(null);
    setSubmissionSuccess(false);
    setReviewText('');
    setRating(0);
  }, []);

  // Function to generate the proof
  const handleGenerateProof = async () => {
    setIsLoading(true);
    setError(null);
    setProofResult(null);
    setBlueprintInstance(null);
    setVerificationStatus('idle');
    setVerifiedProductName(null);
    setSubmissionStatus('idle');
    setSubmissionError(null);
    setSubmissionSuccess(false);
    setRating(0);

    const blueprintId = selectedBlueprintId;

    if (!emailContent.trim()) {
      setError('Please upload an email file first');
      setIsLoading(false);
      return;
    }

    try {
      const sdk = zkeSDK();
      const blueprint = await sdk.getBlueprint(blueprintId);
      setBlueprintInstance(blueprint);

      const prover = blueprint.createProver();
      const proof = await prover.generateProof(emailContent);

      setProofResult(proof);
    } catch (err) {
      console.error('Error generating proof:', err);
      setError(`Failed to generate proof: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setIsLoading(false);
    }
  };

  // New SDK verification function
  const verifyProofWithSDK = async (proof: Proof) => {
    setVerificationStatus('verifying');
    setIsLoading(false);
    setError(null);

    if (!blueprintInstance || !isBlockchainReady) {
      setError(!blueprintInstance ? 'Blueprint not loaded' : 'Wallet not connected to Base Sepolia');
      setVerificationStatus('failed');
      return;
    }

    try {
      const verificationResult = await blueprintInstance.verifyProofOnChain(proof);
      const isValid = typeof verificationResult === 'boolean' ? verificationResult : (verificationResult as any)?.success;

      if (isValid) {
        setVerificationStatus('verified');
        const productName = proof.props?.publicData?.subject?.[0] || 'Product';
        setVerifiedProductName(productName);
      } else {
        setVerificationStatus('failed');
        setError(`Blockchain verification failed via SDK`);
      }
    } catch (err) {
      console.error('Error during SDK verification:', err);
      setVerificationStatus('failed');
      const message = (err as any)?.shortMessage || (err instanceof Error ? err.message : 'Unknown SDK verification error');
      setError(`Blockchain verification error: ${message}`);
    }
  };

  // Function to verify the proof with the backend
  const verifyProofWithBackend = async (proof: Proof) => {
    setVerificationStatus('verifying');

    try {
      const response = await fetch(`${API_URL}/verify-gumroad-proof`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        body: JSON.stringify({
          proofObject: proof,
          blueprintId: selectedBlueprintId
        }),
        mode: 'cors'
      });

      const data = await response.json();

      if (response.ok && data.verified) {
        setVerificationStatus('verified');
        setVerifiedProductName(data.productName);
      } else {
        setVerificationStatus('failed');
        setError(`Verification failed: ${data.message || 'Unknown error'}`);
      }
    } catch (err) {
      setVerificationStatus('failed');
      setError(`Verification error: ${err instanceof Error ? err.message : 'Unknown error - Possible CORS or connection issue'}`);
    }
  };

  // Function to submit review
  const handleSubmitReview = async () => {
    if (!proofResult) {
      setSubmissionError('Please generate a proof first');
      return;
    }

    if (!reviewText.trim()) {
      setSubmissionError('Please enter a review');
      return;
    }

    if (rating === 0) {
      setSubmissionError('Please select a star rating');
      return;
    }

    setSubmissionStatus('submitting');
    setSubmissionError(null);
    setSubmissionSuccess(false);

    try {
      if (verificationMode === 'blockchain' && isBlockchainReady) {
        console.log('Submitting review to ReviewRegistry contract...');

        // Extract nullifier and productId from proof's public outputs
        const publicOutputs = proofResult?.props?.publicOutputs;
        if (!publicOutputs || publicOutputs.length < 4) {
          throw new Error("Proof public outputs missing or invalid for extracting nullifier.");
        }
        const NULLIFIER_INDEX = 3; // Replace with actual index!
        const nullifierHex = `0x${BigInt(publicOutputs[NULLIFIER_INDEX]).toString(16).padStart(64, "0")}`;

        // Derive productId
        const productIdentifier = verifiedProductName || 'unknown-product';
        const productIdBytes = toUtf8Bytes(productIdentifier);
        const productIdHex = keccak256(productIdBytes);

        const serviceName = supportedBlueprints.find(bp => bp.id === selectedBlueprintId)?.name || 'Unknown Service';

        // Call the contract hook (without the proofData argument)
        const result = await submitReviewToContract(
          nullifierHex as `0x${string}`,
          productIdHex as `0x${string}`,
          reviewText.trim(),
          rating,
          serviceName
        );

        if (result.success) {
          console.log('Review submitted successfully to contract! Tx:', result.txHash);
          setSubmissionStatus('submitted');
          setSubmissionSuccess(true);
          setReviewText('');
          setRating(0);
        } else {
          console.error('Contract submission failed:', result.error);
          setSubmissionStatus('failed');
          setSubmissionError(result.error || 'Failed to submit review to contract');
        }
      } else {
        // Submit review via backend (off-chain mode)
        await submitReviewViaBackend();
      }
    } catch (err) {
      console.error('Error during submission process:', err);
      setSubmissionStatus('failed');
      setSubmissionError(`Submission error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Function to submit review via backend
  const submitReviewViaBackend = async () => {
    try {
      if (!proofResult) {
        throw new Error('Proof is missing');
      }

      const proofToSubmit = { ...proofResult };

      const response = await fetch(`${API_URL}/submit-review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        body: JSON.stringify({
          proofObject: proofToSubmit,
          reviewText: reviewText.trim(),
          blueprintId: selectedBlueprintId,
          rating: rating
        }),
        mode: 'cors'
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSubmissionStatus('submitted');
        setSubmissionSuccess(true);
        setReviewText('');
        setRating(0);
      } else {
        setSubmissionStatus('failed');
        setSubmissionError(data.message || 'Failed to submit review');
      }
    } catch (err) {
      throw err;
    }
  };

  // Get current blueprint name
  const currentBlueprintName = supportedBlueprints.find(bp => bp.id === selectedBlueprintId)?.name || 'Proof';

  // Function to calculate estimated time remaining
  const getEstimatedTimeRemaining = () => {
    if (progress < 10) return 'about 1-2 minutes';
    if (progress < 30) return 'about 1 minute';
    if (progress < 60) return 'about 45 seconds';
    if (progress < 80) return 'about 30 seconds';
    return 'less than 15 seconds';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center pb-2 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-800">
          Purchase Verification Engine
        </h2>
        <BlockchainStatus />
      </div>

      {/* Verification Mode Toggle */}
      <div className="flex items-center space-x-4 bg-blue-50 p-3 rounded-lg">
        <span className="text-sm font-medium text-gray-700">Verification Mode:</span>
        <div className="flex space-x-1">
          <button
            onClick={() => setVerificationMode('offchain')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${verificationMode === 'offchain'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
          >
            Off-chain
          </button>
          <button
            onClick={() => setVerificationMode('blockchain')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${!isBlockchainReady
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : verificationMode === 'blockchain'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            disabled={!isBlockchainReady}
            title={!isBlockchainReady ? 'Connect wallet to Base Sepolia to enable' : ''}
          >
            Blockchain
          </button>
        </div>
        {verificationMode === 'blockchain' && (
          <span className="text-xs text-blue-600">
            Reviews will be stored on the Base blockchain
          </span>
        )}
      </div>

      {/* Blueprint selector dropdown */}
      <div className="mb-4">
        <label htmlFor="blueprintSelect" className="block mb-2 text-sm font-medium text-gray-700">
          Select Proof Type:
        </label>
        <select
          id="blueprintSelect"
          value={selectedBlueprintId}
          onChange={(e) => setSelectedBlueprintId(e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          disabled={isLoading || verificationStatus === 'verifying' || submissionStatus === 'submitting'}
        >
          {supportedBlueprints.map((bp) => (
            <option key={bp.id} value={bp.id}>
              {bp.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          Upload Email File (.eml)
        </label>

        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept=".eml"
          className="hidden"
        />

        {/* File upload area */}
        <div
          className={`border-2 border-dashed rounded-lg p-6 transition-colors 
                    flex flex-col items-center justify-center cursor-pointer
                    ${isDragging
              ? 'border-blue-500 bg-blue-50'
              : emailContent
                ? 'border-green-400 bg-green-50'
                : 'border-gray-300 hover:border-blue-400 bg-gray-50 hover:bg-blue-50'}`}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={!emailContent ? handleSelectClick : undefined}
          style={{ minHeight: '200px' }}
        >
          {emailContent ? (
            <div className="text-center">
              <div className="mb-2 flex items-center justify-center text-green-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">Email File Uploaded!</h3>
              <p className="text-sm text-gray-600 mb-3 truncate max-w-xs mx-auto" title={fileName}>
                {fileName}
              </p>
              <div className="flex justify-center">
                <button
                  onClick={(e) => { e.stopPropagation(); handleClearFile(); }}
                  className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
                  disabled={isLoading || verificationStatus === 'verifying' || submissionStatus === 'submitting'}
                >
                  Clear File
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-3 flex items-center justify-center text-blue-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">Drag and drop your email file here</h3>
              <p className="text-sm text-gray-500 mb-4">or click to browse for a .eml file</p>
              <button
                type="button"
                onClick={handleSelectClick}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Select Email File
              </button>
            </>
          )}
        </div>

        <p className="text-xs text-gray-500">
          Upload a {currentBlueprintName} email saved as .eml format
        </p>
      </div>

      <div className="flex justify-center mt-6">
        <button
          className="inline-flex items-center justify-center px-6 py-3 border border-transparent 
                     text-base font-medium rounded-md shadow-sm bg-blue-600 text-white 
                     hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 
                     focus:ring-blue-500 w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleGenerateProof}
          disabled={isLoading || !emailContent.trim() || verificationStatus === 'verifying' || submissionStatus === 'submitting'}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Generating Proof...</span>
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              <span>Generate Proof</span>
            </>
          )}
        </button>
      </div>

      {isLoading && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md shadow-sm">
          <div className="flex items-start">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500 mr-3 flex-shrink-0">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            <div className="w-full">
              <h3 className="text-lg font-medium text-blue-800">Generating proof...</h3>

              {/* Progress percentage and phase */}
              <div className="flex justify-between items-center mt-2 text-sm">
                <span className="text-blue-700 font-medium">{currentPhase}</span>
                <span className="text-blue-700">{Math.round(progress)}%</span>
              </div>

              {/* Progress bar */}
              <div className="mt-2 h-2 w-full bg-blue-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>

              {/* Estimated time */}
              <p className="mt-2 text-sm text-blue-600">
                Estimated time remaining: {getEstimatedTimeRemaining()}
              </p>

              <p className="mt-3 text-xs text-blue-600">
                This process is computationally intensive. Please don't close this page.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Verification status display */}
      {verificationStatus === 'verifying' && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md shadow-sm animate-pulse">
          <div className="flex items-start">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500 mr-3 flex-shrink-0">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            <div>
              <h3 className="text-lg font-medium text-blue-800">Verifying proof...</h3>
              <p className="mt-1 text-sm text-blue-600">
                {verificationMode === 'blockchain'
                  ? 'Verifying proof on Base blockchain. Please confirm the transaction in your wallet.'
                  : 'Sending proof to verification server. This should take just a moment.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {verificationStatus === 'verified' && !submissionSuccess && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md shadow-sm">
          <div className="flex items-start">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500 mr-3 flex-shrink-0">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <div className="w-full">
              <h3 className="text-lg font-medium text-green-800">Purchase Verified!</h3>
              <div className="flex items-center space-x-1">
                <p className="text-sm text-green-600 mb-4">
                  {verifiedProductName ?
                    `Proof verified for purchase: ${verifiedProductName}` :
                    'Your purchase has been cryptographically verified.'}
                </p>
                {verificationMode === 'blockchain' && (
                  <span className="px-2 py-0.5 text-xs bg-green-200 text-green-800 rounded-full mb-4">Verified on Base</span>
                )}
              </div>

              {/* Review submission form */}
              <div className="mt-4 space-y-3">
                {/* Star Rating Input */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rate this product
                  </label>
                  <StarRatingInput
                    value={rating}
                    onChange={setRating}
                    disabled={submissionStatus === 'submitting' || submissionSuccess}
                  />
                </div>

                <label className="block text-sm font-medium text-gray-700">
                  Write Your Review
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                  placeholder="Share your honest review about this product..."
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  disabled={submissionStatus === 'submitting' || submissionSuccess}
                />

                <div className="flex justify-end">
                  <button
                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent 
                              text-sm font-medium rounded-md shadow-sm bg-green-600 text-white 
                              hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 
                              focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleSubmitReview}
                    disabled={isSubmittingReview || submissionStatus === 'submitting' || !reviewText.trim() || rating === 0 || submissionSuccess || (verificationMode === 'blockchain' && !isBlockchainReady)}
                  >
                    {isSubmittingReview || submissionStatus === 'submitting' ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Submitting{verificationMode === 'blockchain' ? ' on Base' : ''}...</span>
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                        </svg>
                        <span>Submit Review{verificationMode === 'blockchain' ? ' on Base' : ''}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Submission success message */}
      {submissionSuccess && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md shadow-sm">
          <div className="flex items-start">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500 mr-3 flex-shrink-0">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <div>
              <h3 className="text-lg font-medium text-green-800">Review Submitted Successfully!</h3>
              <div className="flex items-center mt-1">
                <p className="text-sm text-green-600">
                  Your verified review has been {verificationMode === 'blockchain' ? 'recorded on the Base blockchain' : 'posted'}. Thank you for your feedback!
                </p>
                {verificationMode === 'blockchain' && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-green-200 text-green-800 rounded-full">
                    On-chain
                  </span>
                )}
              </div>
              <div className="mt-4">
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onClick={handleClearFile}
                >
                  Submit Another Review
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Submission error message */}
      {submissionError && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md shadow-sm">
          <div className="flex items-start">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500 mr-3 flex-shrink-0">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <div>
              <h3 className="text-lg font-medium text-red-800">Submission Error</h3>
              <p className="mt-1 text-sm text-red-600">{submissionError}</p>
              {verificationMode === 'blockchain' ? (
                <p className="mt-1 text-xs text-gray-500">Make sure your wallet is connected to Base Sepolia and has enough ETH</p>
              ) : (
                <p className="mt-1 text-xs text-gray-500">API Endpoint: {API_URL}/submit-review</p>
              )}
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md shadow-sm">
          <div className="flex items-start">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500 mr-3 flex-shrink-0">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <div>
              <h3 className="text-lg font-medium text-red-800">Error</h3>
              <p className="mt-1 text-sm text-red-600">{error}</p>
              {error?.includes('Verification') && verificationMode === 'offchain' && (
                <p className="mt-1 text-xs text-gray-500">API Endpoint: {API_URL}/verify-gumroad-proof</p>
              )}
            </div>
          </div>
        </div>
      )}

      {proofResult && !submissionSuccess && (
        <div className="mt-8 border border-gray-200 rounded-lg shadow-sm bg-white overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500 mr-2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              <h3 className="text-lg font-medium text-gray-900">Generated Proof</h3>
            </div>
            <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
              {verificationMode === 'blockchain' ? 'Blockchain Compatible' : 'Off-chain Verification'}
            </div>
          </div>
          <div className="p-4 bg-gray-50 max-h-[400px] overflow-auto">
            <pre className="whitespace-pre-wrap text-sm font-mono bg-white p-4 rounded border border-gray-200 shadow-inner">
              {JSON.stringify(proofResult, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlockchainProofGenerator;
