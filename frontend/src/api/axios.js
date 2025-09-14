import axios from 'axios';
import toast from 'react-hot-toast';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  withCredentials: true,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    // Return successful responses as-is
    return response;
  },
  (error) => {
    // Handle different types of errors
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          // Unauthorized - only redirect if not on login/signup pages
          const currentPath = window.location.pathname;
          const isAuthPage = currentPath === '/login' || currentPath === '/signup';
          
          if (!isAuthPage) {
            handleUnauthorized();
          }
          break;
          
        case 403:
          // Forbidden - show error message
          toast.error(data.message || 'Access denied. You do not have permission to perform this action.');
          break;
          
        case 404:
          // Not found
          toast.error(data.message || 'The requested resource was not found.');
          break;
          
        case 422:
          // Validation errors
          if (data.errors && Array.isArray(data.errors)) {
            // Show first validation error
            toast.error(data.errors[0].msg || data.errors[0].message || 'Validation failed');
          } else {
            toast.error(data.message || 'Validation failed');
          }
          break;
          
        case 429:
          // Too many requests
          toast.error('Too many requests. Please try again later.');
          break;
          
        case 500:
          // Server error
          toast.error('Server error. Please try again later.');
          break;
          
        default:
          // Other server errors
          toast.error(data.message || `Error ${status}: Something went wrong`);
      }
    } else if (error.request) {
      // Network error - no response received
      toast.error('Network error. Please check your connection and try again.');
    } else {
      // Other errors
      toast.error('An unexpected error occurred. Please try again.');
    }
    
    return Promise.reject(error);
  }
);

// Handle unauthorized access
const handleUnauthorized = () => {
  // Clear any stored user data
  localStorage.removeItem('user');
  
  // Show error message
  toast.error('Session expired. Please log in again.');
  
  // Redirect to login page
  setTimeout(() => {
    window.location.href = '/login';
  }, 1000);
};

// Success notification helper
export const showSuccess = (message) => {
  toast.success(message);
};

// Error notification helper
export const showError = (message) => {
  toast.error(message);
};

// Info notification helper
export const showInfo = (message) => {
  toast(message, {
    icon: 'ℹ️',
  });
};

// Warning notification helper
export const showWarning = (message) => {
  toast(message, {
    icon: '⚠️',
  });
};

export default api;
