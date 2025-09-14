import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth';
import { validateSignupForm } from '../utils/validation';

const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    address: '',
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  // Redirect if already authenticated
  useEffect(() => {
    if (authService.isAuthenticated()) {
      const user = authService.getCurrentUserFromStorage();
      redirectBasedOnRole(user.role);
    }
  }, []);

  const redirectBasedOnRole = (role) => {
    switch (role) {
      case 'ADMIN':
        navigate('/admin');
        break;
      case 'STORE_OWNER':
        navigate('/owner');
        break;
      case 'USER':
        navigate('/stores');
        break;
      default:
        navigate('/');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear field error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
    
    // Clear API error
    if (apiError) {
      setApiError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Client-side validation
    const validation = validateSignupForm(
      formData.email,
      formData.password,
      formData.name,
      formData.address
    );
    
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setIsLoading(true);
    setApiError('');

    try {
      const response = await authService.signup(
        formData.email,
        formData.password,
        formData.name,
        formData.address
      );
      
      if (response.success) {
        // Redirect based on user role (new users are typically USER role)
        redirectBasedOnRole(response.user.role);
      }
    } catch (error) {
      setApiError(error.message || 'Signup failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-sky-gradient flex items-center justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 sm:space-y-8">
        <div>
          <h2 className="mt-4 sm:mt-6 text-center text-2xl sm:text-3xl font-extrabold text-primary-700">
            Create your account
          </h2>
          <p className="mt-2 text-center text-xs sm:text-sm text-primary-600">
            Or{' '}
            <button
              onClick={() => navigate('/login')}
              className="font-medium text-primary-500 hover:text-primary-700 transition-colors"
            >
              sign in to your existing account
            </button>
          </p>
        </div>
        
        <form className="mt-6 sm:mt-8 space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
          <div className="card-primary">
            {apiError && (
              <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm">
                {apiError}
              </div>
            )}
            
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-primary-700 mb-1">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`input-primary ${errors.email ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
                  placeholder="Enter your email"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-primary-700 mb-1">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`input-primary ${errors.password ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
                  placeholder="Enter your password"
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}
                <p className="mt-1 text-xs text-primary-500">
                  Password must be 8-16 characters with at least one uppercase letter and one special character
                </p>
              </div>
              
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-primary-700 mb-1">
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`input-primary ${errors.name ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
                  placeholder="Enter your full name (20-60 characters)"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
                <p className="mt-1 text-xs text-primary-500">
                  Name must be between 20 and 60 characters
                </p>
              </div>
              
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-primary-700 mb-1">
                  Address
                </label>
                <textarea
                  id="address"
                  name="address"
                  rows={3}
                  required
                  value={formData.address}
                  onChange={handleInputChange}
                  className={`input-primary resize-none ${errors.address ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
                  placeholder="Enter your address (max 400 characters)"
                />
                {errors.address && (
                  <p className="mt-1 text-sm text-red-600">{errors.address}</p>
                )}
                <p className="mt-1 text-xs text-primary-500">
                  Address must not exceed 400 characters
                </p>
              </div>
            </div>
            
            <div className="mt-4 sm:mt-6">
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full flex justify-center items-center text-sm sm:text-base py-2 sm:py-3"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating account...
                  </>
                ) : (
                  'Create account'
                )}
              </button>
            </div>
          </div>
        </form>
        
        <div className="text-center">
          <p className="text-xs sm:text-sm text-primary-600">
            By creating an account, you agree to our terms of service and privacy policy.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
