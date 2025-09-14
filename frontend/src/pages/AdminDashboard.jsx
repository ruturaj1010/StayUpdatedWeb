import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../services/admin';
import { authService } from '../services/auth';
import UsersTable from '../components/tables/UsersTable';
import StoresTable from '../components/tables/StoresTable';
import AddUserModal from '../components/modals/AddUserModal';
import AddStoreModal from '../components/modals/AddStoreModal';
import ChangePasswordModal from '../components/modals/ChangePasswordModal';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [dashboardStats, setDashboardStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [notification, setNotification] = useState('');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showAddStoreModal, setShowAddStoreModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

  // Check authentication and admin role
  useEffect(() => {
    const currentUser = authService.getCurrentUserFromStorage();
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    if (currentUser.role !== 'ADMIN') {
      navigate('/');
      return;
    }
    
    setUser(currentUser);
  }, [navigate]);

  // Fetch dashboard statistics
  useEffect(() => {
    if (user) {
      fetchDashboardStats();
    }
  }, [user]);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await adminService.getDashboardStats();
      
      if (response.success) {
        setDashboardStats(response.data);
      } else {
        setError('Failed to fetch dashboard statistics');
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleAddUser = () => {
    setShowAddUserModal(true);
  };

  const handleAddStore = () => {
    setShowAddStoreModal(true);
  };

  const handleUserAdded = () => {
    setNotification('User added successfully!');
    setTimeout(() => setNotification(''), 3000);
    // Refresh dashboard stats
    fetchDashboardStats();
  };

  const handleStoreAdded = () => {
    setNotification('Store added successfully!');
    setTimeout(() => setNotification(''), 3000);
    // Refresh dashboard stats
    fetchDashboardStats();
  };


  // Navigation handlers for dashboard cards
  const handleNavigateToUsers = () => {
    setActiveTab('users');
  };

  const handleNavigateToStores = () => {
    setActiveTab('stores');
  };


  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-sky-gradient">
      {/* Navigation */}
      <nav className="nav-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between h-auto sm:h-16 py-4 sm:py-0">
            <div className="flex items-center mb-4 sm:mb-0">
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-primary-700">
                StayUpdated - Admin Dashboard
              </h1>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <span className="text-sm sm:text-base text-primary-600 mb-2 sm:mb-0">
                Welcome, {user.name} (Admin)
              </span>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <button 
                  onClick={() => navigate("/")}
                  className="btn-secondary text-sm px-3 py-2"
                >
                  Home
                </button>
                <button 
                  onClick={() => setShowChangePasswordModal(true)}
                  className="btn-primary text-sm px-3 py-2"
                >
                  Change Password
                </button>
                <button 
                  onClick={handleLogout}
                  className="btn-secondary text-sm px-3 py-2"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Notification */}
      {notification && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="bg-green-100 border border-green-300 text-green-700 px-4 py-3 rounded-lg">
            {notification}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Page Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-primary-700 mb-2">
            Admin Dashboard
          </h1>
          <p className="text-sm sm:text-base text-primary-600">
            Manage users, stores, and view system statistics
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6 sm:mb-8">
          <nav className="flex flex-wrap space-x-4 sm:space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-2 px-1 border-b-2 font-medium text-xs sm:text-sm ${
                activeTab === 'overview'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`py-2 px-1 border-b-2 font-medium text-xs sm:text-sm ${
                activeTab === 'users'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Users
            </button>
            <button
              onClick={() => setActiveTab('stores')}
              className={`py-2 px-1 border-b-2 font-medium text-xs sm:text-sm ${
                activeTab === 'stores'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Stores
            </button>
          </nav>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            {/* Statistics Cards */}
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                <p className="mt-2 text-primary-600">Loading dashboard...</p>
              </div>
            ) : dashboardStats ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Total Users Card */}
                <div 
                  className="card-primary cursor-pointer hover:shadow-lg transition-shadow duration-200"
                  onClick={handleNavigateToUsers}
                >
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Total Users</p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {dashboardStats.totals.totalUsers}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Total Stores Card */}
                <div 
                  className="card-primary cursor-pointer hover:shadow-lg transition-shadow duration-200"
                  onClick={handleNavigateToStores}
                >
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Total Stores</p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {dashboardStats.totals.totalStores}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Total Ratings Card */}
                <div className="card-primary">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Total Ratings</p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {dashboardStats.totals.totalRatings}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Average Rating Card */}
                <div className="card-primary">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Average Rating</p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {dashboardStats.averages.averageRating}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {/* User Statistics by Role */}
            {dashboardStats && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="card-primary">
                  <h3 className="text-lg font-semibold text-primary-700 mb-4">Users by Role</h3>
                  <div className="space-y-3">
                    {Object.entries(dashboardStats.userStats.byRole).map(([role, count]) => (
                      <div key={role} className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">
                          {adminService.formatRole(role)}
                        </span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${adminService.getRoleBadgeColor(role)}`}>
                          {count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card-primary">
                  <h3 className="text-lg font-semibold text-primary-700 mb-4">Recent Activity (Last 7 Days)</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">New Users</span>
                      <span className="text-sm text-gray-900">{dashboardStats.recentActivity.last7Days.newUsers}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">New Stores</span>
                      <span className="text-sm text-gray-900">{dashboardStats.recentActivity.last7Days.newStores}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">New Ratings</span>
                      <span className="text-sm text-gray-900">{dashboardStats.recentActivity.last7Days.newRatings}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <UsersTable 
            onAddUser={handleAddUser}
            currentUser={user}
          />
        )}

        {/* Stores Tab */}
        {activeTab === 'stores' && (
          <StoresTable 
            onAddStore={handleAddStore}
          />
        )}
      </main>

      {/* Modals */}
      <AddUserModal
        isOpen={showAddUserModal}
        onClose={() => setShowAddUserModal(false)}
        onUserAdded={handleUserAdded}
      />
      
      <AddStoreModal
        isOpen={showAddStoreModal}
        onClose={() => setShowAddStoreModal(false)}
        onStoreAdded={handleStoreAdded}
      />
      
      <ChangePasswordModal
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
      />
    </div>
  );
};

export default AdminDashboard;
