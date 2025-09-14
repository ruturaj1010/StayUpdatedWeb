import React from 'react';

const StarRating = ({ rating, size = 'sm', showValue = false, className = '' }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;
  
  const getSizeClass = () => {
    switch (size) {
      case 'xs': return 'text-xs';
      case 'sm': return 'text-sm';
      case 'md': return 'text-base';
      case 'lg': return 'text-lg';
      case 'xl': return 'text-xl';
      default: return 'text-sm';
    }
  };

  const renderStars = () => {
    const stars = [];
    
    for (let i = 1; i <= 5; i++) {
      let starClass = 'text-gray-300';
      
      if (i <= fullStars) {
        starClass = 'text-yellow-400';
      } else if (i === fullStars + 1 && hasHalfStar) {
        starClass = 'text-yellow-400';
      }
      
      stars.push(
        <span key={i} className={`${getSizeClass()} ${starClass}`}>
          ★
        </span>
      );
    }
    
    return stars;
  };

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      <div className="flex">
        {renderStars()}
      </div>
      {showValue && (
        <span className={`${getSizeClass()} font-medium text-primary-700 ml-1`}>
          {parseFloat(rating).toFixed(1)}
        </span>
      )}
    </div>
  );
};

export default StarRating;
