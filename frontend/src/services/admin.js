import api, { showSuccess, showError } from '../api/axios';

// Admin service functions
export const adminService = {
  // Get dashboard statistics
  async getDashboardStats() {
    try {
      const response = await api.get('/admin/dashboard');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch dashboard statistics' };
    }
  },

  // Get users with filters, sorting, and pagination
  async getUsers(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      // Add query parameters
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== '') {
          queryParams.append(key, params[key]);
        }
      });
      
      const response = await api.get(`/admin/users?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch users' };
    }
  },

  // Get stores with filters, sorting, and pagination
  async getStores(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      // Add query parameters
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== '') {
          queryParams.append(key, params[key]);
        }
      });
      
      const response = await api.get(`/admin/stores?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch stores' };
    }
  },

  // Create new user
  async createUser(userData) {
    try {
      const response = await api.post('/admin/users', userData);
      showSuccess('User created successfully!');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to create user' };
    }
  },

  // Create new store
  async createStore(storeData) {
    try {
      const response = await api.post('/admin/stores', storeData);
      showSuccess('Store created successfully!');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to create store' };
    }
  },


  // Delete user by ID
  async deleteUser(userId) {
    try {
      const response = await api.delete(`/admin/users/${userId}`);
      showSuccess('User deleted successfully!');
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to delete user';
      showError(errorMessage);
      throw error.response?.data || { message: errorMessage };
    }
  },

  // Delete store by ID
  async deleteStore(storeId) {
    try {
      const response = await api.delete(`/admin/stores/${storeId}`);
      showSuccess('Store deleted successfully!');
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to delete store';
      showError(errorMessage);
      throw error.response?.data || { message: errorMessage };
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

  // Format role for display
  formatRole(role) {
    const roleMap = {
      'ADMIN': 'Admin',
      'STORE_OWNER': 'Store Owner',
      'USER': 'User'
    };
    return roleMap[role] || role;
  },

  // Get role badge color
  getRoleBadgeColor(role) {
    const colorMap = {
      'ADMIN': 'bg-red-100 text-red-800',
      'STORE_OWNER': 'bg-primary-100 text-primary-700',
      'USER': 'bg-green-100 text-green-800'
    };
    return colorMap[role] || 'bg-gray-100 text-gray-800';
  },

  // Update admin password
  async updatePassword(currentPassword, newPassword, confirmPassword) {
    try {
      const response = await api.put('/admin/update-password', {
        currentPassword,
        newPassword,
        confirmPassword
      });
      showSuccess('Password updated successfully!');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update password' };
    }
  }
};
