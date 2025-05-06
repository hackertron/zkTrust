'use client';

import { useState, useEffect, useCallback } from 'react';
import StarRatingDisplay from './StarRatingDisplay';
import { useWeb3 } from '@/context/Web3Context';
import { ethers } from 'ethers';

// Define Review type matching the structure returned by the contract + formatted date
type Review = {
  id: number;
  productId: string;
  reviewer: string;
  content: string;
  rating: number;
  timestamp: number;
  serviceName?: string;
  formattedDate?: string;
};

const ReviewList = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { active, contracts, provider } = useWeb3();

  // Function to format timestamp
  const formatDate = (timestampSeconds: number): string => {
    if (!timestampSeconds) return 'Unknown date';
    const date = new Date(timestampSeconds * 1000);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  // Function to fetch reviews from the blockchain
  const fetchOnChainReviews = useCallback(async () => {
    if (!active || !contracts.reviewStorage || !provider) {
      console.log("Skipping review fetch: Wallet not connected or contract unavailable.");
      setIsLoading(false);
      setReviews([]);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    console.log("Fetching reviews from ReviewStorage contract:", contracts.reviewStorage.target);

    try {
      const countBigInt = await contracts.reviewStorage.reviewCount();
      const totalReviews = Number(countBigInt);
      console.log(`Total reviews on-chain: ${totalReviews}`);

      if (totalReviews === 0) {
        setReviews([]);
        setIsLoading(false);
        return;
      }

      const fetchedReviews: Review[] = [];
      const reviewsToFetch = Math.min(20, totalReviews);
      const startIndex = totalReviews;
      const endIndex = Math.max(1, totalReviews - reviewsToFetch + 1);

      console.log(`Fetching reviews from ID ${endIndex} to ${startIndex}`);

      for (let i = startIndex; i >= endIndex; i--) {
        try {
          const reviewData = await contracts.reviewStorage.reviews(i);
          const transformedReview: Review = {
            id: Number(reviewData.id),
            productId: reviewData.productId,
            reviewer: reviewData.reviewer,
            content: reviewData.content,
            rating: Number(reviewData.rating),
            timestamp: Number(reviewData.timestamp),
            serviceName: reviewData.serviceName,
            formattedDate: formatDate(Number(reviewData.timestamp)),
          };
          fetchedReviews.push(transformedReview);
        } catch (fetchErr) {
          console.error(`Error fetching review ID ${i}:`, fetchErr);
        }
      }

      console.log("Fetched reviews:", fetchedReviews);
      setReviews(fetchedReviews);
      setError(null);
    } catch (err) {
      console.error('Error fetching on-chain reviews:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch on-chain reviews');
      setReviews([]);
    } finally {
      setIsLoading(false);
    }
  }, [active, contracts.reviewStorage, provider]);

  useEffect(() => {
    fetchOnChainReviews();
  }, [fetchOnChainReviews]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 pb-2 border-b border-gray-200">
        Latest On-Chain Reviews
      </h2>

      {isLoading ? (
        <div className="p-6 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600 mb-2"></div>
          <p className="text-gray-600">Loading reviews from blockchain...</p>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600 font-medium">Error fetching reviews:</p>
          <p className="text-sm text-red-500 mt-1">{error}</p>
          <p className="text-xs text-gray-500 mt-1">Please ensure your wallet is connected to Base Sepolia and the page is refreshed.</p>
        </div>
      ) : !active ? (
        <div className="p-6 border-2 border-dashed border-gray-200 rounded-lg text-center">
          <p className="text-gray-500">Please connect your wallet to view on-chain reviews.</p>
        </div>
      ) : reviews.length === 0 ? (
        <div className="p-6 border-2 border-dashed border-gray-200 rounded-lg text-center">
          <p className="text-gray-500">No reviews submitted on-chain yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-white p-4 rounded-lg shadow border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold text-gray-800 break-all" title={review.productId}>
                  Product ID: {review.productId.substring(0, 10)}...
                </h3>
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex items-center flex-shrink-0 ml-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Verified On-Chain
                </span>
              </div>

              {review.rating && review.rating > 0 && (
                <div className="mb-2">
                  <StarRatingDisplay rating={review.rating} className="text-lg" />
                </div>
              )}

              <p className="text-gray-600 mb-3 whitespace-pre-line">{review.content}</p>

              <div className="flex flex-wrap justify-between items-center text-xs text-gray-500 gap-2">
                <span className="font-mono break-all" title={`Reviewer: ${review.reviewer}`}>
                  By: {review.reviewer.substring(0, 6)}...{review.reviewer.substring(review.reviewer.length - 4)}
                </span>
                <span>Submitted on {review.formattedDate}</span>
                {review.serviceName && (
                  <span className="bg-gray-100 px-2 py-1 rounded">
                    via {review.serviceName}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReviewList;