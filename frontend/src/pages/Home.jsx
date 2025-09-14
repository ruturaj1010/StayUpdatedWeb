import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/auth";

export const Home = () => {
  const navigate = useNavigate();
  const user = authService.getCurrentUserFromStorage();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    try {
      setMobileOpen(false); // Close mobile menu when logging out
      await authService.logout();
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleNavigation = (path) => {
    setMobileOpen(false); // Close mobile menu when navigating
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-sky-gradient">
      {/* Navigation */}
      <nav className="bg-white shadow-md fixed top-0 left-0 w-full z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Logo */}
            <h1 className="text-2xl font-extrabold text-primary-700 tracking-wide cursor-pointer">
              StayUpdated
            </h1>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-6">
              {user ? (
                <>
                  <span className="text-gray-600">
                    Welcome, <b>{user.name}</b> ({user.role})
                  </span>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 rounded-lg bg-primary-500 text-white hover:bg-primary-700 transition"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => handleNavigation("/login")}
                    className="px-4 py-2 rounded-lg bg-primary-500 text-white hover:bg-primary-700 transition"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => handleNavigation("/signup")}
                    className="px-4 py-2 rounded-lg border border-primary-500 text-primary-700 hover:bg-primary-50 transition"
                  >
                    Sign Up
                  </button>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="text-primary-700 hover:text-primary-900 focus:outline-none"
              >
                <svg
                  className="h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  {mobileOpen ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {mobileOpen && (
          <div className="md:hidden bg-white shadow-lg px-6 py-4 space-y-4">
            {user ? (
              <>
                <span className="block text-gray-600">
                  Welcome, <b>{user.name}</b> ({user.role})
                </span>
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 rounded-lg bg-primary-500 text-white hover:bg-primary-700 transition"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => handleNavigation("/login")}
                  className="w-full px-4 py-2 rounded-lg bg-primary-500 text-white hover:bg-primary-700 transition"
                >
                  Login
                </button>
                <button
                  onClick={() => handleNavigation("/signup")}
                  className="w-full px-4 py-2 rounded-lg border border-primary-500 text-primary-700 hover:bg-primary-50 transition"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <header className="flex-1 flex items-center justify-center text-center px-6 py-16 bg-gradient-to-r from-primary-100 via-white to-primary-50">
        <div className="max-w-3xl mt-10">
          <h1 className="text-4xl font-extrabold text-primary-700 leading-tight">
            Simplify Store & User Management
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Secure, scalable, and easy-to-use platform for users, store owners,
            and admins — all in one place.
          </p>
          <div className="mt-6 space-x-4">
            <button
              onClick={() => handleNavigation("/signup")}
              className="px-6 py-3 rounded-lg bg-primary-500 text-white font-medium hover:bg-primary-700 transition"
            >
              Get Started
            </button>
            <button
              onClick={() => handleNavigation("/stores")}
              className="px-6 py-3 rounded-lg border border-primary-500 text-primary-700 font-medium hover:bg-primary-50 transition"
            >
              Explore Stores
            </button>
          </div>
        </div>
      </header>

      {/* Features */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-primary-700 mb-12">
            Powerful Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="p-6 shadow-lg rounded-xl bg-primary-50 hover:shadow-xl transition">
              <h3 className="text-xl font-semibold text-primary-700 mb-3">
                🔐 Authentication
              </h3>
              <p className="text-gray-600">
                Secure login and signup with JWT authentication and role-based
                access.
              </p>
            </div>
            <div className="p-6 shadow-lg rounded-xl bg-primary-50 hover:shadow-xl transition">
              <h3 className="text-xl font-semibold text-primary-700 mb-3">
                🏬 Store Management
              </h3>
              <p className="text-gray-600">
                Explore stores, add ratings, and view performance with real-time
                data.
              </p>
            </div>
            <div className="p-6 shadow-lg rounded-xl bg-primary-50 hover:shadow-xl transition">
              <h3 className="text-xl font-semibold text-primary-700 mb-3">
                📊 Admin Dashboard
              </h3>
              <p className="text-gray-600">
                Manage users and stores with advanced filters, exports, and
                insights.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary-500 text-white py-6 mt-auto">
        <div className="max-w-6xl mx-auto px-6 flex justify-between items-center">
          <p className="text-sm">
            © {new Date().getFullYear()} Roxilers. All rights reserved.
          </p>
          <div className="space-x-4">
            <a href="#" className="hover:underline">
              Privacy Policy
            </a>
            <a href="#" className="hover:underline">
              Terms of Service
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};
