import api, { showSuccess, showError } from '../api/axios';

// Auth service functions
export const authService = {
  // Login user
  async login(email, password) {
    try {
      const response = await api.post('/auth/login', {
        email,
        password,
      });
      
      // Store user data in localStorage (excluding sensitive info)
      const userData = {
        id: response.data.user.id,
        email: response.data.user.email,
        name: response.data.user.name,
        role: response.data.user.role,
      };
      localStorage.setItem('user', JSON.stringify(userData));
      
      showSuccess('Login successful!');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Login failed' };
    }
  },

  // Register user
  async signup(email, password, name, address) {
    try {
      const response = await api.post('/auth/signup', {
        email,
        password,
        name,
        address,
      });
      
      // Store user data in localStorage
      const userData = {
        id: response.data.user.id,
        email: response.data.user.email,
        name: response.data.user.name,
        role: response.data.user.role,
      };
      localStorage.setItem('user', JSON.stringify(userData));
      
      showSuccess('Account created successfully!');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Signup failed' };
    }
  },

  // Logout user
  async logout() {
    try {
      await api.post('/auth/logout');
      localStorage.removeItem('user');
      showSuccess('Logged out successfully!');
      return { success: true };
    } catch (error) {
      // Even if logout fails on server, clear local storage
      localStorage.removeItem('user');
      showSuccess('Logged out successfully!');
      return { success: true };
    }
  },

  // Get current user info
  async getCurrentUser() {
    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get user info' };
    }
  },

  // Check if user is authenticated
  isAuthenticated() {
    const user = localStorage.getItem('user');
    return user !== null;
  },

  // Get current user from localStorage
  getCurrentUserFromStorage() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  // Check if user has specific role
  hasRole(role) {
    const user = this.getCurrentUserFromStorage();
    return user && user.role === role;
  },

  // Check if user is admin
  isAdmin() {
    return this.hasRole('ADMIN');
  },

  // Check if user is store owner
  isStoreOwner() {
    return this.hasRole('STORE_OWNER');
  },

  // Check if user is regular user
  isUser() {
    return this.hasRole('USER');
  },

  // Change user password
  async changePassword(currentPassword, newPassword) {
    try {
      const response = await api.post('/auth/change-password', {
        currentPassword,
        newPassword
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to change password' };
    }
  },
};
