import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/admin';

const UsersTable = ({ onAddUser, currentUser }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filter states
  const [filters, setFilters] = useState({
    name: '',
    email: '',
    address: '',
    role: ''
  });
  
  // Pagination states
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalUsers: 0,
    limit: 10
  });
  
  // Sorting states
  const [sorting, setSorting] = useState({
    sortBy: 'name',
    sortOrder: 'DESC'
  });

  // Fetch users when filters, pagination, or sorting change
  useEffect(() => {
    fetchUsers();
  }, [pagination.currentPage, filters, sorting]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      
      const params = {
        page: pagination.currentPage,
        limit: pagination.limit,
        sortBy: sorting.sortBy,
        sortOrder: sorting.sortOrder,
        ...filters
      };
      
      const response = await adminService.getUsers(params);
      
      if (response.success) {
        setUsers(response.data);
        setPagination(prev => ({
          ...prev,
          totalPages: response.pagination.totalPages,
          totalUsers: response.pagination.totalUsers
        }));
      } else {
        setError('Failed to fetch users');
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handleSortChange = (field) => {
    setSorting(prev => ({
      sortBy: field,
      sortOrder: prev.sortBy === field && prev.sortOrder === 'ASC' ? 'DESC' : 'ASC'
    }));
  };

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };


  const clearFilters = () => {
    setFilters({
      name: '',
      email: '',
      address: '',
      role: ''
    });
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handleDeleteUser = async (userId, userName) => {
    if (window.confirm(`Are you sure you want to delete user "${userName}"?`)) {
      try {
        await adminService.deleteUser(userId);
        // Refresh the users list
        fetchUsers();
      } catch (err) {
        setError(err.message || 'Failed to delete user');
      }
    }
  };

  return (
    <div className="card-primary">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-primary-700">Users Management</h2>
        <div className="flex space-x-2">
          <button onClick={onAddUser} className="btn-primary">
            Add User
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-primary-700 mb-1">
            Name
          </label>
          <input
            type="text"
            value={filters.name}
            onChange={(e) => handleFilterChange('name', e.target.value)}
            className="input-primary"
            placeholder="Filter by name..."
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-primary-700 mb-1">
            Email
          </label>
          <input
            type="email"
            value={filters.email}
            onChange={(e) => handleFilterChange('email', e.target.value)}
            className="input-primary"
            placeholder="Filter by email..."
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-primary-700 mb-1">
            Address
          </label>
          <input
            type="text"
            value={filters.address}
            onChange={(e) => handleFilterChange('address', e.target.value)}
            className="input-primary"
            placeholder="Filter by address..."
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-primary-700 mb-1">
            Role
          </label>
          <select
            value={filters.role}
            onChange={(e) => handleFilterChange('role', e.target.value)}
            className="input-primary"
          >
            <option value="">All Roles</option>
            <option value="STORE_OWNER">Store Owner</option>
            <option value="USER">User</option>
          </select>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <button onClick={clearFilters} className="btn-secondary text-sm">
          Clear Filters
        </button>
        <p className="text-sm text-primary-600">
          Showing {users.length} of {pagination.totalUsers} users
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
          <p className="mt-2 text-primary-600">Loading users...</p>
        </div>
      )}

      {/* Users Table */}
      {!loading && (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSortChange('name')}
                  >
                    Name {sorting.sortBy === 'name' && (sorting.sortOrder === 'ASC' ? '↑' : '↓')}
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSortChange('email')}
                  >
                    Email {sorting.sortBy === 'email' && (sorting.sortOrder === 'ASC' ? '↑' : '↓')}
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSortChange('address')}
                  >
                    Address {sorting.sortBy === 'address' && (sorting.sortOrder === 'ASC' ? '↑' : '↓')}
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSortChange('role')}
                  >
                    Role {sorting.sortBy === 'role' && (sorting.sortOrder === 'ASC' ? '↑' : '↓')}
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSortChange('average_rating')}
                  >
                    Average Rating {sorting.sortBy === 'average_rating' && (sorting.sortOrder === 'ASC' ? '↑' : '↓')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user, index) => (
                  <tr key={`${user.email}-${index}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {user.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {user.address}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${adminService.getRoleBadgeColor(user.role)}`}>
                        {adminService.formatRole(user.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.role === 'STORE_OWNER' && user.average_rating ? (
                        <div className="flex items-center space-x-1">
                          <div className="flex">
                            {Array.from({ length: 5 }, (_, i) => (
                              <span
                                key={i}
                                className={`text-sm ${
                                  i < Math.floor(parseFloat(user.average_rating))
                                    ? 'text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              >
                                ★
                              </span>
                            ))}
                          </div>
                          <span className="text-gray-500">
                            ({user.average_rating})
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {user.role !== 'ADMIN' && (
                        <button
                          onClick={() => handleDeleteUser(user.id, user.name)}
                          className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-lg text-sm font-medium transition-colors duration-200"
                          title="Delete user"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="mt-6 flex justify-center">
              <nav className="flex space-x-2">
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                  className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-2 rounded-lg ${
                      page === pagination.currentPage
                        ? 'bg-primary-500 text-white'
                        : 'bg-white text-primary-700 border border-primary-300 hover:bg-primary-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                
                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === pagination.totalPages}
                  className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </nav>
            </div>
          )}
        </>
      )}

      {/* No Users Message */}
      {!loading && users.length === 0 && (
        <div className="text-center py-8">
          <p className="text-primary-600">No users found matching your criteria.</p>
        </div>
      )}
    </div>
  );
};

export default UsersTable;
