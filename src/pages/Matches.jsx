/**
 * Matches Page
 *
 * This page shows buyer/seller matches based on wishlists and listings.
 * If someone is selling a card on your wishlist, or if someone wants
 * a card you're selling, it shows up here.
 *
 * I think this is one of the coolest features of CardVault -
 * it connects buyers and sellers automatically.
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { matchAPI } from '../services/api';
import { FiSearch, FiDollarSign } from 'react-icons/fi';
import { GiCardPick } from 'react-icons/gi';
import Loader from '../components/Loader';
import MakeOfferModal from '../components/MakeOfferModal';
import './Matches.css';

function Matches() {
  // Match data
  const [matches, setMatches] = useState({
    sellersWithWantedCards: [],
    buyersForYourCards: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Tab to switch between buying and selling matches
  const [activeTab, setActiveTab] = useState('buying');

  // Make offer modal - stores the listing to make an offer on
  const [offerListing, setOfferListing] = useState(null);

  // Fetch matches on mount
  useEffect(() => {
    const fetchMatches = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await matchAPI.getMatches();
        setMatches(response.data.data || {
          sellersWithWantedCards: [],
          buyersForYourCards: [],
        });
      } catch (err) {
        console.error('Error fetching matches:', err);
        setError('Failed to load matches.');
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, []);

  // Format condition for display
  const formatCondition = (condition) => {
    const conditions = {
      near_mint: 'NM',
      lightly_played: 'LP',
      moderately_played: 'MP',
      heavily_played: 'HP',
      damaged: 'DMG',
    };
    return conditions[condition] || condition;
  };

  // Get current matches based on active tab
  const currentMatches =
    activeTab === 'buying'
      ? matches.sellersWithWantedCards || []
      : matches.buyersForYourCards || [];

  return (
    <div className="matches-page">
      {/* Header */}
      <div className="matches-header">
        <h1>Your Matches</h1>
        <p>Connect with buyers and sellers based on your wishlist and listings</p>
      </div>

      {/* Tabs */}
      <div className="match-tabs">
        <button
          className={`tab ${activeTab === 'buying' ? 'active' : ''}`}
          onClick={() => setActiveTab('buying')}
        >
          Cards You Want ({matches.sellersWithWantedCards?.length || 0})
        </button>
        <button
          className={`tab ${activeTab === 'selling' ? 'active' : ''}`}
          onClick={() => setActiveTab('selling')}
        >
          Potential Buyers ({matches.buyersForYourCards?.length || 0})
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <Loader message="Finding matches..." />
      ) : error ? (
        <div className="matches-error">
          <p>{error}</p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>
            Try Again
          </button>
        </div>
      ) : currentMatches.length === 0 ? (
        <div className="matches-empty">
          {activeTab === 'buying' ? (
            <>
              <FiSearch className="empty-icon" />
              <h3>No matches yet</h3>
              <p>
                Add cards to your wishlist and we'll match you with sellers.
              </p>
              <Link to="/wishlist" className="btn btn-primary">
                View Wishlist
              </Link>
            </>
          ) : (
            <>
              <FiDollarSign className="empty-icon" />
              <h3>No potential buyers yet</h3>
              <p>
                Create listings and we'll match you with interested buyers.
              </p>
              <Link to="/listings/create" className="btn btn-primary">
                Create Listing
              </Link>
            </>
          )}
        </div>
      ) : (
        <div className="matches-list">
          {currentMatches.map((match, index) => (
            <div key={index} className="match-row">
              {/* Card info */}
              <Link
                to={`/cards/${match.card?.externalId || match.card?._id}`}
                className="match-card-info"
              >
                <div className="match-thumb">
                  {match.card?.imageUrl ? (
                    <img src={match.card.imageUrl} alt={match.card.name} />
                  ) : (
                    <GiCardPick className="thumb-placeholder" />
                  )}
                </div>
                <div className="match-details">
                  <h3>{match.card?.name || 'Unknown Card'}</h3>
                  <p>{match.card?.setName}</p>
                </div>
              </Link>

              {/* Match info */}
              {activeTab === 'buying' ? (
                // Show seller info
                <div className="match-seller-info">
                  <div className="seller-details">
                    <span className="seller-avatar">
                      {match.listing?.seller?.username?.charAt(0).toUpperCase()}
                    </span>
                    <span className="seller-name">
                      {match.listing?.seller?.username}
                    </span>
                  </div>
                  <div className="match-pricing">
                    <span className="match-price">
                      ${match.listing?.price?.toFixed(2)}
                    </span>
                    {match.listing?.condition && (
                      <span className="match-condition">
                        {formatCondition(match.listing.condition)}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                // Show buyer info
                <div className="match-buyer-info">
                  <div className="buyer-details">
                    <span className="buyer-avatar">
                      {match.buyer?.username?.charAt(0).toUpperCase()}
                    </span>
                    <span className="buyer-name">{match.buyer?.username}</span>
                  </div>
                  {match.maxPrice > 0 && (
                    <span className="max-price">
                      Willing to pay up to ${match.maxPrice.toFixed(2)}
                    </span>
                  )}
                </div>
              )}

              {/* Actions */}
              {activeTab === 'buying' && match.listing?._id && (
                <div className="match-actions">
                  <Link to={`/listings/${match.listing._id}`} className="btn btn-sm btn-secondary">
                    View Listing
                  </Link>
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => setOfferListing({ ...match.listing, card: match.card })}
                  >
                    Make Offer
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {/* Make offer modal */}
      {offerListing && (
        <MakeOfferModal
          listing={offerListing}
          onClose={() => setOfferListing(null)}
        />
      )}
    </div>
  );
}

export default Matches;
