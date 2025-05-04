'use client';

import { useState, useEffect } from 'react';
import StarRatingDisplay from './StarRatingDisplay';

// Define API URL - now pointing to port 3002 for the backend
const API_URL = 'https://zktrust.onrender.com/api';

// Define Review type
type Review = {
  id: number;
  productName: string;
  reviewText: string;
  isVerified: boolean;
  createdAt: string;
  serviceName?: string;
  rating?: number;
};

const ReviewList = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setIsLoading(true);
        console.log('Fetching reviews from:', `${API_URL}/reviews`);
        
        const response = await fetch(`${API_URL}/reviews`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            // Add cache-busting parameter
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
          // Add credentials if CORS needs it
          // credentials: 'include',
          // Add mode for proper CORS requests
          mode: 'cors'
        });
        
        if (!response.ok) {
          throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Received reviews data:', data);
        setReviews(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching reviews:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch reviews');
      } finally {
        setIsLoading(false);
      }
    };

    fetchReviews();
  }, []);

  // Format date function
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 pb-2 border-b border-gray-200">
        Verified Reviews
      </h2>

      {isLoading ? (
        <div className="p-6 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600 mb-2"></div>
          <p className="text-gray-600">Loading reviews...</p>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600 font-medium">Error: {error}</p>
          <p className="text-sm text-red-500 mt-1">
            There was a problem contacting the server. The backend might not be running or there might be a CORS issue.
          </p>
          <div className="mt-2 text-xs text-gray-600">
            <p>Backend URL: {API_URL}/reviews</p>
          </div>
        </div>
      ) : reviews.length === 0 ? (
        <div className="p-6 border-2 border-dashed border-gray-200 rounded-lg text-center">
          <p className="text-gray-500">No reviews submitted yet. Be the first to submit a verified review!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div 
              key={review.id} 
              className="bg-white p-4 rounded-lg shadow border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold text-gray-800">{review.productName}</h3>
                {review.isVerified && (
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Verified Purchase
                  </span>
                )}
              </div>
              
              {/* Display star rating if available */}
              {review.rating && (
                <div className="mb-2">
                  <StarRatingDisplay rating={review.rating} className="text-lg" />
                </div>
              )}
              
              <p className="text-gray-600 mb-3 whitespace-pre-line">{review.reviewText}</p>
              
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>Submitted on {formatDate(review.createdAt)}</span>
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