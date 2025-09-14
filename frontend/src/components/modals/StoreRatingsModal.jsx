import React, { useState, useEffect } from 'react';
import { ownerService } from '../../services/owner';
import StarRating from '../ui/StarRating';

const StoreRatingsModal = ({ isOpen, onClose, store }) => {
  const [ratings, setRatings] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Pagination states (simplified)
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalRatings: 0,
    limit: 10
  });

  // Fetch ratings when modal opens or page changes
  useEffect(() => {
    if (isOpen && store) {
      fetchRatings();
    } else if (!isOpen) {
      // Reset state when modal closes
      setRatings([]);
      setStatistics(null);
      setError('');
      setLoading(false);
    }
  }, [isOpen, store, pagination.currentPage]);

  const fetchRatings = async () => {
    if (!store) return;
    
    try {
      setLoading(true);
      setError('');
      
      // Ensure page and limit values are integers
      const params = {
        page: parseInt(pagination.currentPage) || 1,
        limit: parseInt(pagination.limit) || 10
      };
      
      console.log('StoreRatingsModal - Sent params:', params);
      console.log('StoreRatingsModal - Store ID:', store.id);
      
      const response = await ownerService.getStoreRatings(store.id, params);
      
      console.log('StoreRatingsModal - API raw response:', response);
      console.log('StoreRatingsModal - Response success:', response.success);
      console.log('StoreRatingsModal - Response data:', response.data);
      
      if (response.success) {
        setRatings(response.data.ratings || []);
        setStatistics(response.data.statistics || null);
        setPagination(prev => ({
          ...prev,
          totalPages: response.pagination?.totalPages || 1,
          totalRatings: response.pagination?.totalRatings || 0
        }));
      } else {
        console.log('StoreRatingsModal - API returned success: false');
        console.log('StoreRatingsModal - Error message:', response.message);
        setError(response.message || 'Failed to load ratings, please try again');
      }
    } catch (err) {
      console.error('Error fetching ratings:', err);
      if (err.message?.includes('401')) {
        setError('Authentication failed. Please log in again.');
      } else if (err.message?.includes('403')) {
        setError('Access denied. You do not have permission to view these ratings.');
      } else if (err.message?.includes('404')) {
        setError('Store not found or you do not have permission to view its ratings.');
      } else {
        setError('Failed to load ratings, please try again');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };

  if (!isOpen || !store) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h3 className="text-xl font-semibold text-primary-700">
              Ratings for {store.name}
            </h3>
            <p className="text-sm text-primary-600 mt-1">
              {store.address}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Statistics */}
        {statistics && (
          <div className="p-6 bg-gray-50 border-b border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary-700">{statistics.average}</p>
                <p className="text-sm text-gray-600">Average Rating</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary-700">{statistics.total}</p>
                <p className="text-sm text-gray-600">Total Ratings</p>
              </div>
              <div className="text-center">
                <StarRating 
                  rating={parseFloat(statistics.average)} 
                  showValue={true}
                  size="md"
                  className="justify-center"
                />
                <p className="text-sm text-gray-600 mt-1">Overall Rating</p>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-96">
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
              <p className="mt-2 text-primary-600">Loading ratings...</p>
            </div>
          )}

          {/* Ratings List */}
          {!loading && (
            <>
              {ratings.length > 0 ? (
                <div className="space-y-4">
                  {ratings.map((rating) => (
                    <div key={rating.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <StarRating 
                              rating={rating.score} 
                              size="sm"
                            />
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${ownerService.getRatingColorClass(rating.score)}`}>
                              {rating.score} - {ownerService.getRatingDescription(rating.score)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">{rating.user.name}</span> ({rating.user.email})
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {ownerService.formatDate(rating.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600">
                    {statistics && statistics.total > 0 
                      ? "Unable to load ratings due to server issue" 
                      : "No ratings found for this store."
                    }
                  </p>
                </div>
              )}

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="mt-6 flex justify-center">
                  <nav className="flex space-x-2">
                    <button
                      onClick={() => handlePageChange(pagination.currentPage - 1)}
                      disabled={pagination.currentPage === 1}
                      className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    
                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-2 rounded-lg ${
                          page === pagination.currentPage
                            ? 'bg-primary-500 text-white'
                            : 'bg-white text-primary-700 border border-primary-300 hover:bg-primary-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    
                    <button
                      onClick={() => handlePageChange(pagination.currentPage + 1)}
                      disabled={pagination.currentPage === pagination.totalPages}
                      className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              )}
              
              {/* Results Summary */}
              <div className="mt-4 text-center text-sm text-gray-600">
                Showing {ratings.length} of {pagination.totalRatings} ratings
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoreRatingsModal;
