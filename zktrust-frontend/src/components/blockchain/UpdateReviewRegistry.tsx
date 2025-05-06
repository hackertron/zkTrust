'use client';

import { useState } from 'react';
import { Contract, toUtf8Bytes, keccak256 } from 'ethers';
import { useWeb3 } from '@/context/Web3Context';
import { CONTRACT_ADDRESSES } from '@/config/constants';

// Import ABI
import ReviewRegistryABI from '../../abi/ReviewRegistry.json';

const UpdateReviewRegistry = () => {
  const { active, provider, account } = useWeb3();
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  const handleBypassAuthorization = async () => {
    if (!active || !provider || !account) {
      setError('Please connect your wallet first');
      return;
    }

    setIsUpdating(true);
    setError(null);
    setSuccess(false);
    setTxHash(null);

    try {
      const signer = await provider.getSigner();

      const reviewRegistry = new Contract(
        CONTRACT_ADDRESSES.reviewRegistry,
        ReviewRegistryABI.abi,
        signer
      );

      const fakeProof = toUtf8Bytes('bypass_auth_test');
      const fakeNullifier = keccak256(toUtf8Bytes('test_nullifier_' + Date.now()));
      const fakeProductId = keccak256(toUtf8Bytes('test_product'));

      console.log("Attempting to call submitReview...");
      const tx = await reviewRegistry.submitReview(
        fakeNullifier,
        fakeProductId,
        'Test review content',
        5,
        'Test Service'
      );

      setTxHash(tx.hash);
      console.log('Transaction sent:', tx.hash);

      const receipt = await tx.wait();
      console.log('Transaction mined:', receipt);

      if (receipt?.status === 1) {
        setSuccess(true);
      } else {
        throw new Error("Transaction failed or reverted.");
      }

    } catch (err: any) {
      console.error('Error attempting bypass:', err);
      const message = err?.revert?.args?.[0] || err.message || 'Unknown error during bypass attempt';
      setError(message);
      setSuccess(false);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-white shadow-sm">
      <h2 className="text-xl font-bold mb-4">Authorization Bypass Utility</h2>
      <p className="text-sm text-gray-600 mb-4">
        This utility attempts to bypass authorization issues in the review submission process.
        Use this if you're experiencing "Not authorized" errors when submitting reviews.
      </p>

      <button
        onClick={handleBypassAuthorization}
        disabled={isUpdating || !active}
        className={`px-4 py-2 rounded ${isUpdating
          ? 'bg-gray-400 cursor-not-allowed'
          : active
            ? 'bg-blue-600 hover:bg-blue-700 text-white'
            : 'bg-gray-300 cursor-not-allowed text-gray-500'
          } transition-colors`}
      >
        {isUpdating ? 'Processing...' : 'Attempt Authorization Bypass'}
      </button>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
          <p className="font-medium">Error:</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded">
          <p className="font-medium">Success!</p>
          <p className="text-sm">Authorization bypass attempt was successful.</p>
          {txHash && (
            <a
              href={`https://sepolia.basescan.org/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              View transaction on BlockExplorer
            </a>
          )}
        </div>
      )}

      <div className="mt-4 text-xs text-gray-500">
        <p>
          WARNING: This is an experimental feature. It attempts to directly interact with the smart contract
          to bypass authorization checks. Use at your own risk.
        </p>
      </div>
    </div>
  );
};

export default UpdateReviewRegistry;
