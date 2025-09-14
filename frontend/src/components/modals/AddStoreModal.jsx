import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/admin';

const AddStoreModal = ({ isOpen, onClose, onStoreAdded }) => {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    owner_id: ''
  });
  const [storeOwners, setStoreOwners] = useState([]);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [loadingOwners, setLoadingOwners] = useState(false);

  // Fetch store owners when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchStoreOwners();
    }
  }, [isOpen]);

  const fetchStoreOwners = async () => {
    setLoadingOwners(true);
    try {
      const response = await adminService.getUsers({ role: 'STORE_OWNER' });
      if (response.success) {
        setStoreOwners(response.data);
      }
    } catch (error) {
      console.error('Error fetching store owners:', error);
    } finally {
      setLoadingOwners(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear field error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Store name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Store name is required';
    } else if (formData.name.length < 1 || formData.name.length > 255) {
      newErrors.name = 'Store name must be between 1 and 255 characters';
    }
    
    // Store address validation
    if (!formData.address.trim()) {
      newErrors.address = 'Store address is required';
    } else if (formData.address.length > 500) {
      newErrors.address = 'Store address must not exceed 500 characters';
    }
    
    // Owner validation
    if (!formData.owner_id) {
      newErrors.owner_id = 'Store owner is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      await adminService.createStore(formData);
      onStoreAdded();
      handleClose();
    } catch (error) {
      console.error('Error creating store:', error);
      // Error handling is done in the service
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      address: '',
      owner_id: ''
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-primary-700">Add New Store</h3>
        </div>
        
        <form onSubmit={handleSubmit} className="px-6 py-4">
          <div className="space-y-4">
            {/* Store Name Field */}
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">
                Store Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`input-primary ${errors.name ? 'border-red-500' : ''}`}
                placeholder="Enter store name"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            {/* Store Address Field */}
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">
                Store Address *
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                rows={3}
                className={`input-primary ${errors.address ? 'border-red-500' : ''}`}
                placeholder="Enter store address"
              />
              {errors.address && (
                <p className="mt-1 text-sm text-red-600">{errors.address}</p>
              )}
            </div>

            {/* Store Owner Field */}
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">
                Store Owner *
              </label>
              {loadingOwners ? (
                <div className="input-primary flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-500"></div>
                  <span className="ml-2 text-sm text-gray-500">Loading owners...</span>
                </div>
              ) : (
                <select
                  name="owner_id"
                  value={formData.owner_id}
                  onChange={handleInputChange}
                  className={`input-primary ${errors.owner_id ? 'border-red-500' : ''}`}
                >
                  <option value="">Select a store owner</option>
                  {storeOwners.map((owner) => (
                    <option key={owner.id} value={owner.id}>
                      {owner.name} ({owner.email})
                    </option>
                  ))}
                </select>
              )}
              {errors.owner_id && (
                <p className="mt-1 text-sm text-red-600">{errors.owner_id}</p>
              )}
              {!loadingOwners && storeOwners.length === 0 && (
                <p className="mt-1 text-sm text-yellow-600">
                  No store owners available. Please create a store owner first.
                </p>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="btn-secondary"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isLoading || storeOwners.length === 0}
            >
              {isLoading ? 'Creating...' : 'Create Store'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddStoreModal;
