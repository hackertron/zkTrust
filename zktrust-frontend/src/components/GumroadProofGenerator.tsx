'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import zkeSDK, { Proof } from '@zk-email/sdk';

// Define API URL - can be moved to environment variable in production
const API_URL = 'http://localhost:3001/api';

// Define verification status type
type VerificationStatus = 'idle' | 'verifying' | 'verified' | 'failed';

const GumroadProofGenerator = () => {
  // State variables
  const [emailContent, setEmailContent] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [proofResult, setProofResult] = useState<Proof | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // New state variables for verification
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('idle');
  const [verifiedProductName, setVerifiedProductName] = useState<string | null>(null);

  // File input reference
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Automatically verify proof when it's generated
  useEffect(() => {
    if (proofResult) {
      verifyProof(proofResult);
    }
  }, [proofResult]);

  // Handle drag events
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

  // Process the file
  const processFile = useCallback(async (file: File) => {
    // Check file extension
    if (!file.name.toLowerCase().endsWith('.eml')) {
      setError('Please upload a valid .eml file');
      return;
    }

    try {
      // Read file content
      const content = await file.text();
      setEmailContent(content);
      setFileName(file.name);
      setError(null);
      
      // Reset verification status when a new file is uploaded
      setVerificationStatus('idle');
      setVerifiedProductName(null);
    } catch (err) {
      setError(`Failed to read file: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setEmailContent('');
      setFileName('');
    }
  }, []);

  // Handle file drop
  const handleDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      await processFile(file);
    }
  }, [processFile]);

  // Handle file selection via button
  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      await processFile(file);
    }
  }, [processFile]);

  // Handle file input button click
  const handleSelectClick = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  // Clear selected file
  const handleClearFile = useCallback(() => {
    setEmailContent('');
    setFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    // Reset verification status when file is cleared
    setVerificationStatus('idle');
    setVerifiedProductName(null);
    setProofResult(null);
  }, []);

  // Function to generate the proof
  const handleGenerateProof = async () => {
    // Reset states
    setIsLoading(true);
    setError(null);
    setProofResult(null);
    setVerificationStatus('idle');
    setVerifiedProductName(null);

    // Define the blueprint ID
    const blueprintId = 'hackertron/GumroadProof@v2';

    // Check if email content is empty
    if (!emailContent.trim()) {
      setError('Please upload an email file first');
      setIsLoading(false);
      return;
    }

    try {
      // Initialize the SDK
      const sdk = zkeSDK();

      // Get the blueprint
      console.log(`Fetching blueprint: ${blueprintId}`);
      const blueprint = await sdk.getBlueprint(blueprintId);

      // Create the prover
      console.log('Creating prover...');
      const prover = blueprint.createProver();

      // Generate the proof
      console.log('Generating proof...');
      const proof = await prover.generateProof(emailContent);

      // Set proof result on success
      console.log('Proof generated successfully!');
      setProofResult(proof);
      
      // Note: The useEffect will trigger verification
    } catch (err) {
      // Handle errors
      console.error('Error generating proof:', err);
      setError(`Failed to generate proof: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      // Always set loading to false when done
      setIsLoading(false);
    }
  };
  
  // Function to verify the proof with backend
  const verifyProof = async (proof: Proof) => {
    // Set verification status to verifying
    setVerificationStatus('verifying');
    
    try {
      // Send proof to backend for verification
      console.log('Sending proof to backend for verification...');
      const response = await fetch(`${API_URL}/verify-gumroad-proof`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ proofObject: proof }),
      });
      
      // Parse response
      const data = await response.json();
      
      // Check if verification was successful
      if (response.ok && data.verified) {
        console.log('Proof verified successfully!');
        setVerificationStatus('verified');
        setVerifiedProductName(data.productName);
      } else {
        console.error('Proof verification failed:', data.message);
        setVerificationStatus('failed');
        setError(`Verification failed: ${data.message || 'Unknown error'}`);
      }
    } catch (err) {
      // Handle errors
      console.error('Error during verification:', err);
      setVerificationStatus('failed');
      setError(`Verification error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 pb-2 border-b border-gray-200">
        Gumroad Purchase Proof Generator
      </h2>

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
                  disabled={isLoading || verificationStatus === 'verifying'}
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
          Upload a Gumroad purchase confirmation email saved as .eml format
        </p>
      </div>

      <div className="flex justify-center mt-6">
        <button
          className="inline-flex items-center justify-center px-6 py-3 border border-transparent 
                     text-base font-medium rounded-md shadow-sm bg-blue-600 text-white 
                     hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 
                     focus:ring-blue-500 w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleGenerateProof}
          disabled={isLoading || !emailContent.trim() || verificationStatus === 'verifying'}
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
              <span>Generate Gumroad Proof</span>
            </>
          )}
        </button>
      </div>

      {isLoading && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md shadow-sm animate-pulse">
          <div className="flex items-start">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500 mr-3 flex-shrink-0">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            <div>
              <h3 className="text-lg font-medium text-blue-800">Generating proof...</h3>
              <p className="mt-1 text-sm text-blue-600">
                This process is computationally intensive and may take 30 seconds to a few minutes.
                Please don't close this page.
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
                Sending proof to verification server. This should take just a moment.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {verificationStatus === 'verified' && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md shadow-sm">
          <div className="flex items-start">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500 mr-3 flex-shrink-0">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <div>
              <h3 className="text-lg font-medium text-green-800">Purchase Verified!</h3>
              <p className="mt-1 text-sm text-green-600">
                {verifiedProductName ? 
                  `Proof verified for purchase: ${verifiedProductName}` : 
                  'Your purchase has been cryptographically verified.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md shadow-sm">
          <div className="flex items-start">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500 mr-3 flex-shrink-0">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <div>
              <h3 className="text-lg font-medium text-red-800">Error</h3>
              <p className="mt-1 text-sm text-red-600">{error}</p>
            </div>
          </div>
        </div>
      )}

      {proofResult && (
        <div className="mt-8 border border-gray-200 rounded-lg shadow-sm bg-white overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500 mr-2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <h3 className="text-lg font-medium text-gray-900">Generated Proof</h3>
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

export default GumroadProofGenerator;