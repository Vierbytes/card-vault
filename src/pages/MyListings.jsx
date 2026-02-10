/**
 * My Listings Page
 *
 * Shows all of the user's marketplace listings with their status.
 * Users can manage their listings from here - edit price, mark as sold, or delete.
 *
 * I organized them with tabs for Active/Sold/All so users can
 * quickly see what's still for sale vs what's already been sold.
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { listingAPI } from '../services/api';
import './MyListings.css';

function MyListings() {
  // Listings data
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter by status
  const [activeTab, setActiveTab] = useState('active');

  // Toast notification
  const [toast, setToast] = useState(null);

  // Fetch listings when tab changes
  useEffect(() => {
    fetchListings();
  }, [activeTab]);

  const fetchListings = async () => {
    setLoading(true);
    setError(null);

    try {
      const status = activeTab === 'all' ? undefined : activeTab;
      const response = await listingAPI.getMine(status);
      setListings(response.data.data || []);
    } catch (err) {
      console.error('Error fetching listings:', err);
      setError('Failed to load your listings.');
    } finally {
      setLoading(false);
    }
  };

  // Show a temporary toast message
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Format condition for display
  const formatCondition = (condition) => {
    const conditions = {
      near_mint: 'Near Mint',
      lightly_played: 'Lightly Played',
      moderately_played: 'Mod. Played',
      heavily_played: 'Heavily Played',
      damaged: 'Damaged',
    };
    return conditions[condition] || condition;
  };

  // Delete a listing
  const handleDelete = async (listingId) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) {
      return;
    }

    try {
      await listingAPI.delete(listingId);
      setListings((prev) => prev.filter((l) => l._id !== listingId));
      showToast('Listing deleted');
    } catch (err) {
      console.error('Error deleting listing:', err);
      showToast('Failed to delete listing', 'error');
    }
  };

  // Mark as sold
  const handleMarkSold = async (listingId) => {
    try {
      await listingAPI.update(listingId, { status: 'sold' });
      setListings((prev) =>
        prev.map((l) => (l._id === listingId ? { ...l, status: 'sold' } : l))
      );
      showToast('Marked as sold!');
    } catch (err) {
      console.error('Error updating listing:', err);
      showToast('Failed to update listing', 'error');
    }
  };

  return (
    <div className="my-listings-page">
      {/* Toast */}
      {toast && (
        <div className={`toast ${toast.type}`}>{toast.message}</div>
      )}

      {/* Header */}
      <div className="listings-header">
        <div className="header-text">
          <h1>My Listings</h1>
          <p>Manage your marketplace listings</p>
        </div>
        <Link to="/listings/create" className="btn btn-primary">
          + New Listing
        </Link>
      </div>

      {/* Status tabs */}
      <div className="status-tabs">
        <button
          className={`tab ${activeTab === 'active' ? 'active' : ''}`}
          onClick={() => setActiveTab('active')}
        >
          Active
        </button>
        <button
          className={`tab ${activeTab === 'sold' ? 'active' : ''}`}
          onClick={() => setActiveTab('sold')}
        >
          Sold
        </button>
        <button
          className={`tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All
        </button>
      </div>

      {/* Listings content */}
      {loading ? (
        <div className="listings-loading">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="listing-skeleton-row">
              <div className="skeleton-thumb"></div>
              <div className="skeleton-details">
                <div className="skeleton-text"></div>
                <div className="skeleton-text short"></div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="listings-error">
          <p>{error}</p>
          <button className="btn btn-primary" onClick={fetchListings}>
            Try Again
          </button>
        </div>
      ) : listings.length === 0 ? (
        <div className="listings-empty">
          <span className="empty-icon">🏷️</span>
          <h3>No {activeTab !== 'all' ? activeTab : ''} listings</h3>
          <p>
            {activeTab === 'active'
              ? "You don't have any active listings. Create one to start selling!"
              : activeTab === 'sold'
              ? "You haven't sold any cards yet."
              : "You don't have any listings yet."}
          </p>
          <Link to="/listings/create" className="btn btn-primary">
            Create a Listing
          </Link>
        </div>
      ) : (
        <div className="listings-list">
          {listings.map((listing) => (
            <div key={listing._id} className={`listing-row ${listing.status}`}>
              {/* Card thumbnail */}
              <Link to={`/cards/${listing.card?.externalId || listing.card?._id}`} className="listing-thumb">
                {listing.card?.imageUrl ? (
                  <img src={listing.card.imageUrl} alt={listing.card.name} />
                ) : (
                  <span className="thumb-placeholder">🃏</span>
                )}
              </Link>

              {/* Listing info */}
              <div className="listing-info">
                <h3 className="listing-name">{listing.card?.name || 'Unknown Card'}</h3>
                <p className="listing-meta">
                  {listing.card?.setName} · {formatCondition(listing.condition)}
                </p>
              </div>

              {/* Price */}
              <div className="listing-price">
                ${listing.price?.toFixed(2)}
              </div>

              {/* Status badge */}
              <div className={`status-badge ${listing.status}`}>
                {listing.status}
              </div>

              {/* Actions */}
              <div className="listing-actions">
                {listing.status === 'active' && (
                  <>
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => handleMarkSold(listing._id)}
                    >
                      Mark Sold
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(listing._id)}
                    >
                      Delete
                    </button>
                  </>
                )}
                {listing.status === 'sold' && (
                  <span className="sold-label">Sold</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyListings;
