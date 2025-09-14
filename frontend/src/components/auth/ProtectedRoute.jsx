import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { authService } from "../../services/auth";

export const ProtectedRoute = ({ children, requiredRole }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const verifyUser = async () => {
      try {
        // First check localStorage
        const localUser = authService.getCurrentUserFromStorage();

        if (!localUser) {
          setIsLoading(false);
          return;
        }

        // Verify with backend only if we have local user data
        try {
          const response = await authService.getCurrentUser();
          if (response.success) {
            setUser(response.user);
          } else {
            // Backend verification failed, clear local storage
            localStorage.removeItem("user");
          }
        } catch (backendError) {
          // Backend verification failed, clear local storage
          localStorage.removeItem("user");
          // Don't show error toast here as it might be expected during login
        }
      } catch (err) {
        setError("Failed to verify user authentication");
        localStorage.removeItem("user");
      } finally {
        setIsLoading(false);
      }
    };

    verifyUser();
  }, []);

  // Show loading while verifying
  if (isLoading) {
    return (
      <div className="min-h-screen bg-sky-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          <p className="mt-2 text-primary-600">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check role-based access
  if (requiredRole && user.role !== requiredRole) {
    // Redirect to appropriate dashboard based on user role
    switch (user.role) {
      case "ADMIN":
        return <Navigate to="/admin" replace />;
      case "STORE_OWNER":
        return <Navigate to="/owner" replace />;
      case "USER":
        return <Navigate to="/stores" replace />;
      default:
        return <Navigate to="/" replace />;
    }
  }

  return children;
};
