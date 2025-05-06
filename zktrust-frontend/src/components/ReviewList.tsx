'use client';

import { useState, useEffect, useCallback } from 'react';
import StarRatingDisplay from './StarRatingDisplay';
import { useWeb3 } from '@/context/Web3Context';
import { ethers } from 'ethers';
import { API_URL } from '@/config/constants';

// Define Review type - add 'source' field
type Review = {
  id: string | number;
  productId?: string;
  reviewer?: string;
  content: string;
  rating: number;
  timestamp: number;
  serviceName?: string;
  formattedDate?: string;
  source: 'on-chain' | 'off-chain';
  productName?: string;
  isVerified?: boolean;
  nullifier?: string;
};

const ReviewList = () => {
  const [displayedReviews, setDisplayedReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { active, contracts, provider } = useWeb3();

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

  const fetchOffChainReviews = useCallback(async (): Promise<Review[]> => {
    try {
      const response = await fetch(`${API_URL}/reviews`, {
        method: 'GET',
        headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' },
        mode: 'cors',
      });
      if (!response.ok) {
        throw new Error(`Backend API responded with ${response.status}`);
      }
      const data = await response.json();
      return data.map((review: any): Review => ({
        id: review.id,
        content: review.reviewText || '',
        rating: review.rating || 0,
        timestamp: review.createdAt ? Math.floor(new Date(review.createdAt).getTime() / 1000) : 0,
        formattedDate: review.createdAt ? formatDate(Math.floor(new Date(review.createdAt).getTime() / 1000)) : 'Unknown date',
        source: 'off-chain',
        productName: review.productName,
        isVerified: review.isVerified,
        serviceName: review.serviceName,
      }));
    } catch (err) {
      console.error("Error fetching off-chain reviews:", err);
      throw err;
    }
  }, []);

  const fetchOnChainReviews = useCallback(async (): Promise<Review[]> => {
    if (!active || !contracts.reviewStorage) {
      console.log("Cannot fetch on-chain: Wallet not active or contract not loaded.");
      return [];
    }
    try {
      const countBigInt = await contracts.reviewStorage.reviewCount();
      const totalReviews = Number(countBigInt);
      if (totalReviews === 0) return [];

      const fetchedReviews: Review[] = [];
      const reviewsToFetch = Math.min(20, totalReviews);
      const startIndex = totalReviews;
      const endIndex = Math.max(1, totalReviews - reviewsToFetch + 1);

      for (let i = startIndex; i >= endIndex; i--) {
        try {
          const reviewData = await contracts.reviewStorage.reviews(i);
          fetchedReviews.push({
            id: Number(reviewData.id),
            productId: reviewData.productId,
            reviewer: reviewData.reviewer,
            content: reviewData.content,
            rating: Number(reviewData.rating),
            timestamp: Number(reviewData.timestamp),
            serviceName: reviewData.serviceName,
            formattedDate: formatDate(Number(reviewData.timestamp)),
            source: 'on-chain',
            nullifier: reviewData.nullifier,
          });
        } catch (fetchErr) {
          console.error(`Error fetching on-chain review ID ${i}:`, fetchErr);
        }
      }
      return fetchedReviews;
    } catch (err) {
      console.error("Error fetching on-chain reviews:", err);
      throw err;
    }
  }, [active, contracts.reviewStorage]);

  useEffect(() => {
    const fetchAndCombineReviews = async () => {
      setIsLoading(true);
      setError(null);
      setDisplayedReviews([]);

      const promisesToAwait = [fetchOffChainReviews()];
      if (active && contracts.reviewStorage) {
        promisesToAwait.push(fetchOnChainReviews());
      } else {
        promisesToAwait.push(Promise.resolve([]));
      }

      const results = await Promise.allSettled(promisesToAwait);

      let combined: Review[] = [];
      let fetchError: string | null = null;

      if (results[0].status === 'fulfilled') {
        combined = combined.concat(results[0].value);
      } else {
        console.error("Off-chain fetch failed:", results[0].reason);
        fetchError = `Failed to fetch off-chain reviews: ${results[0].reason?.message || 'Unknown error'}`;
      }

      if (results.length > 1 && results[1].status === 'fulfilled') {
        combined = combined.concat(results[1].value);
      } else if (results.length > 1 && results[1].status === 'rejected') {
        console.error("On-chain fetch failed:", results[1].reason);
        const onChainErrorMsg = `Failed to fetch on-chain reviews: ${results[1].reason?.message || 'Unknown error'}`;
        fetchError = fetchError ? `${fetchError}. ${onChainErrorMsg}` : onChainErrorMsg;
      }

      const uniqueReviews = combined.reduce((acc, current) => {
        const isDuplicate = acc.some(item =>
          item.content === current.content &&
          Math.abs(item.timestamp - current.timestamp) < 60
        );
        if (!isDuplicate) {
          acc.push(current);
        }
        return acc;
      }, [] as Review[]);

      uniqueReviews.sort((a, b) => b.timestamp - a.timestamp);

      setDisplayedReviews(uniqueReviews);
      setError(fetchError);
      setIsLoading(false);
    };

    fetchAndCombineReviews();
  }, [active, contracts.reviewStorage, fetchOffChainReviews, fetchOnChainReviews]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 pb-2 border-b border-gray-200">
        Verified Reviews
      </h2>

      {isLoading ? (
        <div className="p-6 text-center">
          <p className="text-gray-600">Loading reviews...</p>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600 font-medium">Error fetching reviews:</p>
          <p className="text-sm text-red-500 mt-1">{error}</p>
        </div>
      ) : displayedReviews.length === 0 ? (
        <div className="p-6 border-2 border-dashed border-gray-200 rounded-lg text-center">
          <p className="text-gray-500">No reviews found.</p>
          {!active && <p className="text-sm text-gray-400 mt-1">Connect wallet to check for on-chain reviews.</p>}
        </div>
      ) : (
        <div className="space-y-4">
          {displayedReviews.map((review) => (
            <div
              key={`${review.source}-${review.id}`}
              className={`p-4 rounded-lg shadow border hover:shadow-md transition-shadow ${review.source === 'on-chain' ? 'border-blue-200 bg-blue-50/30' : 'border-gray-100 bg-white'
                }`}
            >
              <div className="flex justify-between items-start mb-2 flex-wrap gap-2">
                <h3 className="text-lg font-semibold text-gray-800 break-all">
                  {review.productName ? review.productName : `Product ID: ${review.productId?.substring(0, 10) ?? 'N/A'}...`}
                </h3>
                <span className={`text-xs px-2 py-1 rounded-full flex items-center flex-shrink-0 ${review.source === 'on-chain'
                  ? 'bg-blue-100 text-blue-800'
                  : review.isVerified
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-600'
                  }`}>
                  {review.source === 'on-chain' ? 'On-Chain' : review.isVerified ? 'Verified Off-Chain' : 'Unverified Off-Chain'}
                </span>
              </div>

              {review.rating > 0 && (
                <div className="mb-2">
                  <StarRatingDisplay rating={review.rating} className="text-lg" />
                </div>
              )}

              <p className="text-gray-600 mb-3 whitespace-pre-line">{review.content}</p>

              <div className="flex flex-wrap justify-between items-center text-xs text-gray-500 gap-2">
                {review.reviewer ? (
                  <span className="font-mono break-all" title={`Reviewer: ${review.reviewer}`}>
                    By: {review.reviewer.substring(0, 6)}...{review.reviewer.substring(review.reviewer.length - 4)}
                  </span>
                ) : (
                  <span>By: Anonymous</span>
                )}
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