import api, { showSuccess, showError } from '../api/axios';

// User service functions
export const userService = {
  // Update user password
  async updatePassword(currentPassword, newPassword, confirmPassword) {
    try {
      const response = await api.put('/users/update-password', {
        currentPassword,
        newPassword,
        confirmPassword
      });
      showSuccess('Password updated successfully!');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update password' };
    }
  },

  // Get user profile
  async getProfile() {
    try {
      const response = await api.get('/users/profile');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch user profile' };
    }
  },

  // Update user profile
  async updateProfile(profileData) {
    try {
      const response = await api.put('/users/profile', profileData);
      showSuccess('Profile updated successfully!');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update profile' };
    }
  }
};
