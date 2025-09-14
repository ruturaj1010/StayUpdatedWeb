import React, { useState, useEffect } from 'react';

const RatingModal = ({ isOpen, onClose, onSubmit, storeName, currentRating = null, isLoading = false }) => {
  const [selectedRating, setSelectedRating] = useState(currentRating || 0);
  const [hoveredRating, setHoveredRating] = useState(0);

  // Reset rating when modal opens/closes or current rating changes
  useEffect(() => {
    if (isOpen) {
      setSelectedRating(currentRating || 0);
      setHoveredRating(0);
    }
  }, [isOpen, currentRating]);

  const handleStarClick = (rating) => {
    setSelectedRating(rating);
  };

  const handleStarHover = (rating) => {
    setHoveredRating(rating);
  };

  const handleStarLeave = () => {
    setHoveredRating(0);
  };

  const handleSubmit = () => {
    if (selectedRating > 0) {
      onSubmit(selectedRating);
    }
  };

  const handleClose = () => {
    setSelectedRating(currentRating || 0);
    setHoveredRating(0);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-primary-700">
            {currentRating ? 'Update Rating' : 'Rate Store'}
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isLoading}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-6">
          <p className="text-primary-600 mb-4">
            How would you rate <span className="font-semibold text-primary-700">{storeName}</span>?
          </p>
          
          <div className="flex justify-center space-x-1 mb-4">
            {[1, 2, 3, 4, 5].map((star) => {
              const isActive = star <= (hoveredRating || selectedRating);
              return (
                <button
                  key={star}
                  onClick={() => handleStarClick(star)}
                  onMouseEnter={() => handleStarHover(star)}
                  onMouseLeave={handleStarLeave}
                  className={`text-4xl transition-colors ${
                    isActive ? 'text-yellow-400' : 'text-gray-300'
                  } hover:text-yellow-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded`}
                  disabled={isLoading}
                >
                  ★
                </button>
              );
            })}
          </div>

          {selectedRating > 0 && (
            <div className="text-center">
              <p className="text-sm text-primary-600">
                {selectedRating === 1 && 'Poor'}
                {selectedRating === 2 && 'Fair'}
                {selectedRating === 3 && 'Good'}
                {selectedRating === 4 && 'Very Good'}
                {selectedRating === 5 && 'Excellent'}
              </p>
            </div>
          )}
        </div>

        <div className="flex space-x-3">
          <button
            onClick={handleClose}
            className="flex-1 btn-secondary"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={selectedRating === 0 || isLoading}
            className="flex-1 btn-primary flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {currentRating ? 'Updating...' : 'Submitting...'}
              </>
            ) : (
              currentRating ? 'Update Rating' : 'Submit Rating'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RatingModal;
