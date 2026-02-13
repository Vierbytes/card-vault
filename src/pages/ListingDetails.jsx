/**
 * Listing Details Page
 *
 * Shows a single marketplace listing with full details.
 * The user can see the card, seller info, condition, price,
 * and description. If it's their own listing they can manage it.
 */

import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { listingAPI } from '../services/api';
import { GiCardPick } from 'react-icons/gi';
import MakeOfferModal from '../components/MakeOfferModal';
import './ListingDetails.css';

function ListingDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Listing data
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Make offer modal
  const [showOfferModal, setShowOfferModal] = useState(false);

  // Fetch listing
  useEffect(() => {
    const fetchListing = async () => {
      setLoading(true);
      try {
        const response = await listingAPI.getById(id);
        setListing(response.data.data);
      } catch (err) {
        console.error('Error fetching listing:', err);
        setError('Listing not found or failed to load.');
      } finally {
        setLoading(false);
      }
    };

    fetchListing();
  }, [id]);

  // Format condition
  const formatCondition = (condition) => {
    const conditions = {
      near_mint: 'Near Mint',
      lightly_played: 'Lightly Played',
      moderately_played: 'Moderately Played',
      heavily_played: 'Heavily Played',
      damaged: 'Damaged',
    };
    return conditions[condition] || condition;
  };

  // Check if current user owns this listing
  const isOwner = user && listing?.seller?._id === user._id;

  // Delete listing
  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this listing?')) return;

    try {
      await listingAPI.delete(id);
      navigate('/listings/mine');
    } catch (err) {
      console.error('Error deleting listing:', err);
      showToast('Failed to delete listing', 'error');
    }
  };

  // Mark as sold
  const handleMarkSold = async () => {
    try {
      await listingAPI.update(id, { status: 'sold' });
      setListing((prev) => ({ ...prev, status: 'sold' }));
      showToast('Marked as sold!');
    } catch (err) {
      console.error('Error updating listing:', err);
      showToast('Failed to update', 'error');
    }
  };

  if (loading) {
    return (
      <div className="listing-details-page">
        <div className="listing-loading">
          <div className="loading-spinner"></div>
          <p>Loading listing...</p>
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="listing-details-page">
        <div className="listing-error">
          <h2>Listing Not Found</h2>
          <p>{error || 'This listing may have been removed.'}</p>
          <Link to="/marketplace" className="btn btn-primary">
            Back to Marketplace
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="listing-details-page">
      <div className="listing-layout">
        {/* Card image */}
        <div className="listing-image-section">
          <div className="listing-card-image">
            {listing.card?.imageUrl ? (
              <img src={listing.card.imageUrl} alt={listing.card.name} />
            ) : (
              <GiCardPick className="image-placeholder" />
            )}
          </div>
          <Link
            to={`/cards/${listing.card?.externalId || listing.card?._id}`}
            className="btn btn-secondary view-card-btn"
          >
            View Card Details
          </Link>
        </div>

        {/* Listing info */}
        <div className="listing-info-section">
          {/* Status badge if sold */}
          {listing.status === 'sold' && (
            <span className="sold-badge">SOLD</span>
          )}

          <h1>{listing.card?.name || 'Unknown Card'}</h1>
          <p className="listing-set">
            {listing.card?.setName} · {listing.card?.game}
          </p>

          <div className="price-box">
            <span className="price-amount">${listing.price?.toFixed(2)}</span>
            <span className="condition-label">
              {formatCondition(listing.condition)}
            </span>
          </div>

          {/* Description */}
          {listing.description && (
            <div className="listing-description">
              <h3>Description</h3>
              <p>{listing.description}</p>
            </div>
          )}

          {/* Seller info */}
          <div className="seller-section">
            <h3>Seller</h3>
            <Link to={`/users/${listing.seller?._id}`} className="seller-card">
              <span className="seller-avatar">
                {listing.seller?.username?.charAt(0).toUpperCase()}
              </span>
              <div className="seller-info">
                <span className="seller-username">{listing.seller?.username}</span>
                <span className="member-since">
                  Member since {new Date(listing.seller?.createdAt).toLocaleDateString()}
                </span>
              </div>
            </Link>
          </div>

          {/* Make offer button - show for non-owners on active listings */}
          {!isOwner && user && listing.status === 'active' && (
            <div className="offer-action">
              <button
                className="btn btn-primary"
                onClick={() => setShowOfferModal(true)}
              >
                Make an Offer
              </button>
            </div>
          )}

          {/* Owner actions */}
          {isOwner && listing.status === 'active' && (
            <div className="owner-actions">
              <button className="btn btn-primary" onClick={handleMarkSold}>
                Mark as Sold
              </button>
              <button className="btn btn-danger" onClick={handleDelete}>
                Delete Listing
              </button>
            </div>
          )}

          {/* Listed date */}
          <p className="listed-date">
            Listed {new Date(listing.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Make offer modal */}
      {showOfferModal && (
        <MakeOfferModal
          listing={listing}
          onClose={() => setShowOfferModal(false)}
        />
      )}
    </div>
  );
}

export default ListingDetails;
