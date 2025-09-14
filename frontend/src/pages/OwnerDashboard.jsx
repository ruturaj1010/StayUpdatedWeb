import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ownerService } from "../services/owner";
import { authService } from "../services/auth";
import StoreRatingsModal from "../components/modals/StoreRatingsModal";
import StoreEditModal from "../components/modals/StoreEditModal";
import ChangePasswordModal from "../components/modals/ChangePasswordModal";
import StarRating from "../components/ui/StarRating";

const OwnerDashboard = () => {
  const navigate = useNavigate();
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);

  // Modal states
  const [ratingsModal, setRatingsModal] = useState({
    isOpen: false,
    store: null,
  });

  const [editModal, setEditModal] = useState({
    isOpen: false,
    store: null,
  });

  const [changePasswordModal, setChangePasswordModal] = useState(false);

  // Check authentication and store owner role
  useEffect(() => {
    const currentUser = authService.getCurrentUserFromStorage();
    if (!currentUser) {
      navigate("/login");
      return;
    }

    if (currentUser.role !== "STORE_OWNER") {
      navigate("/");
      return;
    }

    setUser(currentUser);
  }, [navigate]);

  // Fetch stores when user is authenticated
  useEffect(() => {
    if (user) {
      fetchStores();
    }
  }, [user]);

  const fetchStores = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await ownerService.getMyStores();

      if (response.success) {
        setStores(response.data);
      } else {
        setError("Failed to fetch your stores");
      }
    } catch (err) {
      setError(err.message || "Failed to fetch your stores");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const openRatingsModal = (store) => {
    setRatingsModal({
      isOpen: true,
      store,
    });
  };

  const closeRatingsModal = () => {
    setRatingsModal({
      isOpen: false,
      store: null,
    });
  };

  const openEditModal = (store) => {
    setEditModal({
      isOpen: true,
      store,
    });
  };

  const closeEditModal = () => {
    setEditModal({
      isOpen: false,
      store: null,
    });
  };

  const openChangePasswordModal = () => {
    setChangePasswordModal(true);
  };

  const closeChangePasswordModal = () => {
    setChangePasswordModal(false);
  };

  const handleStoreUpdate = (updatedStore) => {
    setStores((prevStores) =>
      prevStores.map((store) =>
        store.id === updatedStore.id ? updatedStore : store
      )
    );
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
                StayUpdated - Store Owner Dashboard
              </h1>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <span className="text-sm sm:text-base text-primary-600 mb-2 sm:mb-0">
                Welcome, {user.name} (Store Owner)
              </span>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <button
                  onClick={() => navigate("/")}
                  className="btn-secondary text-sm px-3 py-2"
                >
                  Home
                </button>
                <button
                  onClick={openChangePasswordModal}
                  className="btn-secondary text-sm px-3 py-2"
                >
                  Change Password
                </button>
                <button onClick={handleLogout} className="btn-secondary text-sm px-3 py-2">
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Page Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-primary-700 mb-2">
            My Stores
          </h1>
          <p className="text-sm sm:text-base text-primary-600">
            Manage your stores and view customer ratings
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            <p className="mt-2 text-primary-600">Loading your stores...</p>
          </div>
        )}

        {/* Stores Grid */}
        {!loading && (
          <>
            {stores.length > 0 ? (
              <>
                <div className="mb-6">
                  <p className="text-primary-600">
                    You own {stores.length} store
                    {stores.length !== 1 ? "s" : ""}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                  {stores.map((store) => (
                    <div
                      key={store.id}
                      className="rounded-2xl shadow-md bg-white p-4 sm:p-5 flex flex-col justify-between hover:shadow-lg transition"
                    >
                      <div>
                        <h3 className="text-lg sm:text-xl font-semibold text-primary-700 mb-1">
                          {store.name}
                        </h3>
                        <p className="text-primary-600 text-xs sm:text-sm mb-4 line-clamp-2">
                          {store.address}
                        </p>

                        {/* Rating Overview */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-2 sm:space-y-0">
                          <StarRating
                            rating={parseFloat(store.rating?.average || 0)}
                            showValue={true}
                            size="sm"
                          />
                          <span className="text-xs sm:text-sm text-primary-600">
                            {store.rating?.total || 0} rating
                            {(store.rating?.total || 0) !== 1 ? "s" : ""}
                          </span>
                        </div>

                        {/* Recent Ratings */}
                        {store.recentRatings?.length > 0 && (
                          <div className="mb-4">
                            <h4 className="text-sm font-medium text-primary-700 mb-2">
                              Recent Ratings
                            </h4>
                            <div className="space-y-2 max-h-28 overflow-y-auto pr-1">
                              {store.recentRatings.map((rating, index) => (
                                <div
                                  key={index}
                                  className="flex items-center justify-between text-xs"
                                >
                                  <div className="flex items-center space-x-2">
                                    <span className="text-primary-600 font-medium">
                                      {rating.user_name}
                                    </span>
                                    <StarRating
                                      rating={rating.score}
                                      size="xs"
                                    />
                                  </div>
                                  <span className="text-gray-500">
                                    {ownerService.formatDate(rating.created_at)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mt-4">
                        <button
                          onClick={() => openRatingsModal(store)}
                          className="flex-1 btn-primary text-sm py-2"
                        >
                          View Ratings
                        </button>
                        <button
                          onClick={() => openEditModal(store)}
                          className="flex-1 btn-secondary text-sm py-2"
                        >
                          Edit Store
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <div className="mb-4">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No stores found
                </h3>
                <p className="text-gray-600 mb-4">
                  You don't have any stores yet. Contact an administrator to add
                  stores to your account.
                </p>
                <button onClick={fetchStores} className="btn-primary">
                  Refresh
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Ratings Modal */}
      <StoreRatingsModal
        isOpen={ratingsModal.isOpen}
        onClose={closeRatingsModal}
        store={ratingsModal.store}
      />

      {/* Edit Store Modal */}
      <StoreEditModal
        isOpen={editModal.isOpen}
        onClose={closeEditModal}
        store={editModal.store}
        onUpdate={handleStoreUpdate}
      />

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={changePasswordModal}
        onClose={closeChangePasswordModal}
      />
    </div>
  );
};

export default OwnerDashboard;
