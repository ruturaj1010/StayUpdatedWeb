import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { storesService } from '../services/stores';
import { authService } from '../services/auth';
import { userService } from '../services/user';
import RatingModal from '../components/modals/RatingModal';
import StarRating from '../components/ui/StarRating';
import ChangePasswordModal from '../components/modals/ChangePasswordModal';

const StoresList = () => {
  const navigate = useNavigate();
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  
  // Search and filter states
  const [nameSearch, setNameSearch] = useState('');
  const [addressSearch, setAddressSearch] = useState('');
  const [minRating, setMinRating] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('ASC');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStores, setTotalStores] = useState(0);
  const limit = 10;
  
  // Rating modal states
  const [ratingModal, setRatingModal] = useState({
    isOpen: false,
    store: null,
    currentRating: null,
    isLoading: false
  });

  // Password modal state
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

  // Check authentication and get user data
  useEffect(() => {
    const currentUser = authService.getCurrentUserFromStorage();
    if (!currentUser) {
      navigate('/login');
      return;
    }
    setUser(currentUser);
  }, [navigate]);

  // Fetch stores when filters change
  useEffect(() => {
    if (user) {
      fetchStores();
    }
}, [user, currentPage, nameSearch, addressSearch, minRating, sortBy, sortOrder]);

  const fetchStores = async () => {
    try {
      setLoading(true);
      setError('');
      
      const params = {
        page: currentPage,
        limit,
        sortBy,
        sortOrder,
        ...(nameSearch && { name: nameSearch }),
        ...(addressSearch && { address: addressSearch }),
        ...(minRating && { minRating: parseFloat(minRating) })
      };
      
      const response = await storesService.getStores(params);
      
      if (response.success) {
        setStores(response.data);
        setTotalPages(response.pagination.totalPages);
        setTotalStores(response.pagination.totalStores);
      } else {
        setError('Failed to fetch stores');
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch stores');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchStores();
  };

  const handleFilterChange = () => {
    setCurrentPage(1);
    fetchStores();
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const openRatingModal = (store) => {
    setRatingModal({
      isOpen: true,
      store,
      currentRating: store.userRating?.score || null,
      isLoading: false
    });
  };

  const closeRatingModal = () => {
    setRatingModal({
      isOpen: false,
      store: null,
      currentRating: null,
      isLoading: false
    });
  };

  const handleRatingSubmit = async (rating) => {
    if (!ratingModal.store) return;
    
    setRatingModal(prev => ({ ...prev, isLoading: true }));
    
    try {
      const response = await storesService.rateStore(ratingModal.store.id, rating);
      
      if (response.success) {
        // Update the store in the list with new rating
        setStores(prevStores => 
          prevStores.map(store => 
            store.id === ratingModal.store.id 
              ? {
                  ...store,
                  rating: {
                    average: response.data.ratingStats.average,
                    total: response.data.ratingStats.total
                  },
                  userRating: {
                    score: rating
                  }
                }
              : store
          )
        );
        
        closeRatingModal();
      }
    } catch (err) {
      setError(err.message || 'Failed to submit rating');
    } finally {
      setRatingModal(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-sky-gradient">
      {/* Navigation */}
      <nav className="nav-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between h-auto sm:h-16 py-4 sm:py-0">
            <div className="flex items-center mb-4 sm:mb-0">
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-primary-700">
                StayUpdated
              </h1>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <span className="text-sm sm:text-base text-primary-600 mb-2 sm:mb-0">
                Welcome, {user.name} ({user.role})
              </span>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <button 
                  onClick={() => navigate("/")}
                  className="btn-secondary text-sm px-3 py-2"
                >
                  Home
                </button>
                <button 
                  onClick={() => setShowChangePasswordModal(true)}
                  className="btn-primary text-sm px-3 py-2"
                >
                  Change Password
                </button>
                <button 
                  onClick={handleLogout}
                  className="btn-secondary text-sm px-3 py-2"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-primary-700 mb-2">
            Store Directory
          </h1>
          <p className="text-sm sm:text-base text-primary-600">
            Discover and rate stores in your area
          </p>
        </div>

        {/* Search and Filters */}
        <div className="card-primary mb-4 sm:mb-6">
          <form onSubmit={handleSearch} className="space-y-3 sm:space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">
                  Store Name
                </label>
                <input
                  type="text"
                  value={nameSearch}
                  onChange={(e) => setNameSearch(e.target.value)}
                  className="input-primary"
                  placeholder="Search by store name..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  value={addressSearch}
                  onChange={(e) => setAddressSearch(e.target.value)}
                  className="input-primary"
                  placeholder="Search by address..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">
                  Minimum Rating
                </label>
                <select
                  value={minRating}
                  onChange={(e) => {
                    setMinRating(e.target.value);
                    handleFilterChange();
                  }}
                  className="input-primary"
                >
                  <option value="">Any Rating</option>
                  <option value="1">1+ Stars</option>
                  <option value="2">2+ Stars</option>
                  <option value="3">3+ Stars</option>
                  <option value="4">4+ Stars</option>
                  <option value="5">5 Stars</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    handleFilterChange();
                  }}
                  className="input-primary"
                >
                  <option value="name">Name</option>
                  <option value="address">Address</option>
                  <option value="average_rating">Rating</option>
                  <option value="total_ratings">Number of Ratings</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">
                  Order
                </label>
                <select
                  value={sortOrder}
                  onChange={(e) => {
                    setSortOrder(e.target.value);
                    handleFilterChange();
                  }}
                  className="input-primary"
                >
                  <option value="DESC">Descending</option>
                  <option value="ASC">Ascending</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-center sm:justify-end">
              <button type="submit" className="btn-primary w-full sm:w-auto text-sm px-4 py-2">
                Search
              </button>
            </div>
          </form>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            <p className="mt-2 text-primary-600">Loading stores...</p>
          </div>
        )}

        {/* Stores Grid */}
        {!loading && (
          <>
            <div className="mb-4 flex justify-between items-center">
              <p className="text-primary-600">
                Showing {stores.length} of {totalStores} stores
              </p>
            </div>
            
            <div className="grid grid-cols-1 gap-3 sm:gap-4">
              {stores.map((store) => (
                <div key={store.id} className="card-primary">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                    {/* Store Info */}
                    <div className="flex-1">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 items-start sm:items-center">
                        {/* Store Name */}
                        <div>
                          <h3 className="text-base sm:text-lg font-semibold text-primary-700">
                            {store.name}
                          </h3>
                        </div>
                        
                        {/* Address */}
                        <div>
                          <p className="text-primary-600 text-xs sm:text-sm line-clamp-2">
                            {store.address}
                          </p>
                        </div>
                        
                        {/* Overall Rating */}
                        <div>
                          <div className="flex items-center space-x-2">
                            <StarRating 
                              rating={parseFloat(store.rating.average)} 
                              size="sm" 
                              showValue={true}
                            />
                            <span className="text-xs text-primary-500">
                              ({store.rating.total} rating{store.rating.total !== 1 ? 's' : ''})
                            </span>
                          </div>
                        </div>
                        
                        {/* User's Submitted Rating */}
                        <div>
                          {store.userRating ? (
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-primary-600">Your Rating:</span>
                              <StarRating 
                                rating={store.userRating.score} 
                                size="sm" 
                                showValue={true}
                              />
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500">Not rated yet</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Submit/Modify Rating Button */}
                    <div className="mt-2 lg:mt-0 lg:ml-4">
                      <button
                        onClick={() => openRatingModal(store)}
                        className={`w-full sm:w-auto px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                          store.userRating 
                            ? 'bg-primary-100 text-primary-700 hover:bg-primary-200' 
                            : 'bg-primary-500 text-white hover:bg-primary-600'
                        }`}
                      >
                        {store.userRating ? 'Modify Rating' : 'Submit Rating'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 sm:mt-8 flex justify-center">
                <nav className="flex flex-wrap justify-center space-x-1 sm:space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2"
                  >
                    Previous
                  </button>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-2 sm:px-3 py-1 sm:py-2 rounded-lg text-xs sm:text-sm ${
                        page === currentPage
                          ? 'bg-primary-500 text-white'
                          : 'bg-white text-primary-700 border border-primary-300 hover:bg-primary-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2"
                  >
                    Next
                  </button>
                </nav>
              </div>
            )}
          </>
        )}

        {/* No Stores Message */}
        {!loading && stores.length === 0 && (
          <div className="text-center py-8 sm:py-12">
            <p className="text-primary-600 text-base sm:text-lg">No stores found matching your criteria.</p>
            <button
              onClick={() => {
                setSearchTerm('');
                setMinRating('');
                setCurrentPage(1);
                fetchStores();
              }}
              className="btn-primary mt-4 text-sm px-4 py-2"
            >
              Clear Filters
            </button>
          </div>
        )}
      </main>

      {/* Rating Modal */}
      <RatingModal
        isOpen={ratingModal.isOpen}
        onClose={closeRatingModal}
        onSubmit={handleRatingSubmit}
        storeName={ratingModal.store?.name}
        currentRating={ratingModal.currentRating}
        isLoading={ratingModal.isLoading}
      />

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
      />
    </div>
  );
};

export default StoresList;
