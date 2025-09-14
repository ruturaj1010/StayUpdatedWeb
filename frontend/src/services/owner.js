import api, { showSuccess, showError } from '../api/axios';

// Owner service functions
export const ownerService = {
  // Get stores owned by the current user
  async getMyStores() {
    try {
      const response = await api.get('/owner/stores');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch your stores' };
    }
  },

  // Get ratings for a specific store (SIMPLIFIED)
  async getStoreRatings(storeId, params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      // Only add page and limit parameters (simplified)
      if (params.page !== undefined && params.page !== '') {
        queryParams.append('page', params.page);
      }
      if (params.limit !== undefined && params.limit !== '') {
        queryParams.append('limit', params.limit);
      }
      
      const response = await api.get(`/owner/stores/${storeId}/ratings?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch store ratings' };
    }
  },

  // Update store information
  async updateStore(storeId, storeData) {
    try {
      const response = await api.patch(`/owner/stores/${storeId}`, storeData);
      showSuccess('Store updated successfully!');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update store' };
    }
  },

  // Format date for display
  formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },


  // Get rating description
  getRatingDescription(rating) {
    const descriptions = {
      1: 'Poor',
      2: 'Fair', 
      3: 'Good',
      4: 'Very Good',
      5: 'Excellent'
    };
    return descriptions[rating] || 'Unknown';
  },

  // Get rating color class
  getRatingColorClass(rating) {
    const colors = {
      1: 'text-red-600 bg-red-100',
      2: 'text-orange-600 bg-orange-100',
      3: 'text-yellow-600 bg-yellow-100',
      4: 'text-primary-600 bg-primary-100',
      5: 'text-green-600 bg-green-100'
    };
    return colors[rating] || 'text-gray-600 bg-gray-100';
  }
};
