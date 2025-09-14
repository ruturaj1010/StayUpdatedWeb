import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth';
import { validateLoginForm } from '../utils/validation';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
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
    const validation = validateLoginForm(formData.email, formData.password);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setIsLoading(true);
    setApiError('');

    try {
      const response = await authService.login(formData.email, formData.password);
      
      if (response.success) {
        // Redirect based on user role
        redirectBasedOnRole(response.user.role);
      }
    } catch (error) {
      setApiError(error.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-sky-gradient flex items-center justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 sm:space-y-8">
        <div>
          <h2 className="mt-4 sm:mt-6 text-center text-2xl sm:text-3xl font-extrabold text-primary-700">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-xs sm:text-sm text-primary-600">
            Or{' '}
            <button
              onClick={() => navigate('/signup')}
              className="font-medium text-primary-500 hover:text-primary-700 transition-colors"
            >
              create a new account
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
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`input-primary ${errors.password ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
                  placeholder="Enter your password"
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}
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
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </button>
            </div>
          </div>
        </form>
        
        <div className="text-center">
          <p className="text-xs sm:text-sm text-primary-600">
            Demo accounts:
          </p>
          <div className="mt-2 text-xs text-primary-500 space-y-1">
            <p className="break-all">Admin: admin@roxilers.com</p>
            <p className="break-all">Store Owner: jane@example.com</p>
            <p className="break-all">User: john@example.com</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
