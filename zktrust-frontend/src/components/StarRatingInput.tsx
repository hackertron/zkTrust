'use client';

import { useState } from 'react';

interface StarRatingInputProps {
  value: number;
  onChange: (rating: number) => void;
  disabled?: boolean;
}

const StarRatingInput: React.FC<StarRatingInputProps> = ({ value, onChange, disabled = false }) => {
  const [hoverRating, setHoverRating] = useState(0);

  // Generate stars (1-5)
  const stars = [1, 2, 3, 4, 5];

  return (
    <div className="flex items-center space-x-1">
      {stars.map((star) => (
        <button
          key={star}
          type="button"
          className={`text-2xl focus:outline-none transition-colors ${
            disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
          }`}
          onClick={() => !disabled && onChange(star)}
          onMouseEnter={() => !disabled && setHoverRating(star)}
          onMouseLeave={() => !disabled && setHoverRating(0)}
          disabled={disabled}
          aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
        >
          {/* Show filled star if: 
              - User is hovering over this star or a higher star, OR
              - This star's rating is less than or equal to the selected value AND user is not hovering
          */}
          {(hoverRating > 0 && star <= hoverRating) || (hoverRating === 0 && star <= value) ? (
            <span className="text-yellow-400">★</span> // Filled star
          ) : (
            <span className="text-gray-300 hover:text-yellow-200">☆</span> // Empty star
          )}
        </button>
      ))}
      
      {/* Display rating text */}
      <span className="ml-2 text-sm text-gray-600">
        {value > 0 
          ? `${value} star${value !== 1 ? 's' : ''}` 
          : hoverRating > 0 
            ? `${hoverRating} star${hoverRating !== 1 ? 's' : ''}` 
            : 'Select rating'}
      </span>
    </div>
  );
};

export default StarRatingInput;
