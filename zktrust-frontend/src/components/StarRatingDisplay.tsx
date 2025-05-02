'use client';

interface StarRatingDisplayProps {
  rating: number;
  className?: string;
}

const StarRatingDisplay: React.FC<StarRatingDisplayProps> = ({ rating, className = '' }) => {
  // Generate 5 stars
  const stars = Array.from({ length: 5 }, (_, i) => i + 1);

  return (
    <div className={`flex items-center ${className}`}>
      {stars.map((star) => (
        <span key={star} className={star <= rating ? 'text-yellow-400' : 'text-gray-300'}>
          {star <= rating ? '★' : '☆'}
        </span>
      ))}
      <span className="ml-2 text-xs text-gray-600">
        {rating > 0 ? `${rating}` : 'No rating'}
      </span>
    </div>
  );
};

export default StarRatingDisplay;
