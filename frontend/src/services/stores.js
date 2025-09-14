import api, { showSuccess, showError } from '../api/axios';

// Stores service functions
export const storesService = {
  // Get all stores with search, sort, and pagination
  async getStores(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      // Add query parameters
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== '') {
          queryParams.append(key, params[key]);
        }
      });
      
      const response = await api.get(`/stores?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch stores' };
    }
  },

  // Get store details by ID
  async getStoreById(storeId) {
    try {
      const response = await api.get(`/stores/${storeId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch store details' };
    }
  },

  // Rate a store (insert or update rating)
  async rateStore(storeId, score) {
    try {
      const response = await api.post(`/stores/${storeId}/rate`, {
        score: parseInt(score)
      });
      showSuccess('Rating submitted successfully!');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to rate store' };
    }
  },

  // Get user's rating for a specific store
  getUserRatingForStore(store, user) {
    if (!user || !store.userRating) {
      return null;
    }
    return store.userRating;
  },

  // Check if user has rated a store
  hasUserRatedStore(store, user) {
    return this.getUserRatingForStore(store, user) !== null;
  },

  // Format rating display
  formatRating(rating) {
    if (!rating || rating === 0) {
      return 'No ratings';
    }
    return parseFloat(rating).toFixed(1);
  },

};
