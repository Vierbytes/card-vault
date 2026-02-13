/**
 * My Offers Page
 *
 * Shows all trade offers - both sent (as buyer) and received (as seller).
 * Uses tabs to switch between the two views, and filter buttons for status.
 *
 * I based the layout on the Matches page since it has a similar
 * tab + list structure. Each offer card shows the card thumbnail,
 * prices, status, and who the other person is.
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { tradeOfferAPI } from '../services/api';
import { GiCardPick } from 'react-icons/gi';
import { FiSend, FiInbox } from 'react-icons/fi';
import Loader from '../components/Loader';
import './MyOffers.css';

function MyOffers() {
  // Tab state - sent or received
  const [activeTab, setActiveTab] = useState('sent');

  // Filter by offer status
  const [statusFilter, setStatusFilter] = useState('');

  // Offer data
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch offers when tab or filter changes
  useEffect(() => {
    const fetchOffers = async () => {
      setLoading(true);
      setError(null);

      try {
        const response =
          activeTab === 'sent'
            ? await tradeOfferAPI.getSent(statusFilter || undefined)
            : await tradeOfferAPI.getReceived(statusFilter || undefined);

        setOffers(response.data.data || []);
      } catch (err) {
        console.error('Error fetching offers:', err);
        setError('Failed to load offers.');
      } finally {
        setLoading(false);
      }
    };

    fetchOffers();
  }, [activeTab, statusFilter]);

  // Format the offer status for display
  const getStatusBadge = (status) => {
    const styles = {
      pending: 'badge-pending',
      accepted: 'badge-accepted',
      declined: 'badge-declined',
      cancelled: 'badge-cancelled',
    };
    return styles[status] || '';
  };

  // Format date to something readable
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="offers-page">
      {/* Header */}
      <div className="offers-header">
        <h1>My Offers</h1>
        <p>Track and manage your trade offers</p>
      </div>

      {/* Tabs */}
      <div className="offer-tabs">
        <button
          className={`tab ${activeTab === 'sent' ? 'active' : ''}`}
          onClick={() => { setActiveTab('sent'); setStatusFilter(''); }}
        >
          Offers Sent
        </button>
        <button
          className={`tab ${activeTab === 'received' ? 'active' : ''}`}
          onClick={() => { setActiveTab('received'); setStatusFilter(''); }}
        >
          Offers Received
        </button>
      </div>

      {/* Status filter pills */}
      <div className="status-filters">
        {['', 'pending', 'accepted', 'declined'].map((status) => (
          <button
            key={status}
            className={`filter-pill ${statusFilter === status ? 'active' : ''}`}
            onClick={() => setStatusFilter(status)}
          >
            {status === '' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <Loader message="Loading offers..." />
      ) : error ? (
        <div className="offers-empty">
          <p>{error}</p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>
            Try Again
          </button>
        </div>
      ) : offers.length === 0 ? (
        <div className="offers-empty">
          {activeTab === 'sent' ? (
            <>
              <FiSend className="empty-icon" />
              <h3>No offers sent yet</h3>
              <p>Browse the marketplace and make offers on cards you want.</p>
              <Link to="/marketplace" className="btn btn-primary">
                Browse Marketplace
              </Link>
            </>
          ) : (
            <>
              <FiInbox className="empty-icon" />
              <h3>No offers received yet</h3>
              <p>When someone makes an offer on your listings, it'll show up here.</p>
              <Link to="/listings/create" className="btn btn-primary">
                Create a Listing
              </Link>
            </>
          )}
        </div>
      ) : (
        <div className="offers-list">
          {offers.map((offer) => (
            <Link
              to={`/offers/${offer._id}`}
              key={offer._id}
              className="offer-row"
            >
              {/* Card thumbnail */}
              <div className="offer-thumb">
                {offer.card?.imageUrl ? (
                  <img src={offer.card.imageUrl} alt={offer.card?.name} />
                ) : (
                  <GiCardPick className="thumb-placeholder" />
                )}
              </div>

              {/* Offer details */}
              <div className="offer-info">
                <h3>{offer.card?.name || 'Unknown Card'}</h3>
                <p className="offer-prices">
                  Offered <strong>${offer.offeredPrice?.toFixed(2)}</strong>
                  <span className="price-separator"> / </span>
                  Listed at ${offer.listingPrice?.toFixed(2)}
                </p>
              </div>

              {/* Other party */}
              <div className="offer-other-user">
                <span className="other-avatar">
                  {activeTab === 'sent'
                    ? offer.seller?.username?.charAt(0).toUpperCase()
                    : offer.buyer?.username?.charAt(0).toUpperCase()}
                </span>
                <span className="other-name">
                  {activeTab === 'sent'
                    ? offer.seller?.username
                    : offer.buyer?.username}
                </span>
              </div>

              {/* Status and date */}
              <div className="offer-meta">
                <span className={`status-badge ${getStatusBadge(offer.status)}`}>
                  {offer.status}
                </span>
                <span className="offer-date">{formatDate(offer.createdAt)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyOffers;
