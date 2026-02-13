/**
 * User Profile Page (Public)
 *
 * Shows a public view of any user's profile - their info, trade stats,
 * and active listings. This is different from the /profile page which
 * is for editing your own account settings.
 *
 * I used Promise.all to fetch the user data, listings, and trade stats
 * all at the same time instead of one after another. It makes the page
 * load faster since the requests happen in parallel.
 */

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../services/api';
import { GiCardPick } from 'react-icons/gi';
import Loader from '../components/Loader';
import './UserProfile.css';

function UserProfile() {
  const { id } = useParams();
  const { user: currentUser } = useAuth();

  // All our data states
  const [user, setUser] = useState(null);
  const [listings, setListings] = useState([]);
  const [tradeStats, setTradeStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if we're looking at our own profile
  const isOwnProfile = currentUser && currentUser._id === id;

  // Game display names - same values as the User model enum
  // but with proper formatting for display
  const gameNames = {
    pokemon: 'Pokemon',
    magic: 'Magic: The Gathering',
    yugioh: 'Yu-Gi-Oh!',
    lorcana: 'Lorcana',
    onepiece: 'One Piece',
    digimon: 'Digimon',
    'union-arena': 'Union Arena',
  };

  // Format condition label - same pattern as Marketplace/ListingDetails
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

  // Format date to show month and year
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  };

  // Fetch everything when the user ID changes
  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fire all three requests at the same time
        const [profileRes, listingsRes, statsRes] = await Promise.all([
          userAPI.getProfile(id),
          userAPI.getUserListings(id),
          userAPI.getUserTradeStats(id),
        ]);

        setUser(profileRes.data.data);
        setListings(listingsRes.data.data || []);
        setTradeStats(statsRes.data.data);
      } catch (err) {
        console.error('Error fetching user profile:', err);
        setError('Failed to load user profile.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [id]);

  if (loading) return <Loader message="Loading profile..." />;

  if (error || !user) {
    return (
      <div className="up-page">
        <div className="up-error">
          <h2>User Not Found</h2>
          <p>{error || 'This user may not exist.'}</p>
          <Link to="/marketplace" className="btn btn-primary">
            Back to Marketplace
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="up-page">
      {/* Profile header - avatar, name, bio, games */}
      <div className="up-header">
        <div className="up-avatar-large">
          {user.avatar ? (
            <img src={user.avatar} alt={user.username} />
          ) : (
            <span className="up-avatar-fallback">
              {user.username?.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        <div className="up-header-info">
          <h1>{user.username}</h1>
          <p className="up-member-since">
            Member since {formatDate(user.createdAt)}
          </p>

          {user.bio && <p className="up-bio">{user.bio}</p>}

          {/* Favorite games as little tags */}
          {user.favoriteGames && user.favoriteGames.length > 0 && (
            <div className="up-games">
              {user.favoriteGames.map((game) => (
                <span key={game} className="up-game-tag">
                  {gameNames[game] || game}
                </span>
              ))}
            </div>
          )}

          {/* Show edit link if viewing your own profile */}
          {isOwnProfile && (
            <Link to="/profile" className="btn btn-secondary up-edit-btn">
              Edit Profile
            </Link>
          )}
        </div>
      </div>

      {/* Trade statistics */}
      {tradeStats && (
        <div className="up-stats">
          <h2>Trade Statistics</h2>
          <div className="up-stats-grid">
            <div className="up-stat-card">
              <span className="up-stat-value">{tradeStats.completedTrades}</span>
              <span className="up-stat-label">Completed Trades</span>
            </div>
            <div className="up-stat-card">
              <span className="up-stat-value">{listings.length}</span>
              <span className="up-stat-label">Active Listings</span>
            </div>
            <div className="up-stat-card">
              <span className="up-stat-value">{tradeStats.offersSent}</span>
              <span className="up-stat-label">Offers Sent</span>
            </div>
            <div className="up-stat-card">
              <span className="up-stat-value">{tradeStats.offersReceived}</span>
              <span className="up-stat-label">Offers Received</span>
            </div>
          </div>
        </div>
      )}

      {/* Active listings section */}
      <div className="up-listings">
        <h2>Active Listings ({listings.length})</h2>

        {listings.length === 0 ? (
          <div className="up-empty">
            <GiCardPick className="up-empty-icon" />
            <p>
              {isOwnProfile
                ? "You don't have any active listings."
                : 'This user has no active listings.'}
            </p>
            {isOwnProfile && (
              <Link to="/listings/create" className="btn btn-primary">
                Create a Listing
              </Link>
            )}
          </div>
        ) : (
          <div className="up-listings-grid">
            {listings.map((listing) => (
              <Link
                key={listing._id}
                to={`/listings/${listing._id}`}
                className="up-listing-card"
              >
                {/* Card image */}
                <div className="up-listing-image">
                  {listing.card?.imageUrl ? (
                    <img src={listing.card.imageUrl} alt={listing.card.name} />
                  ) : (
                    <GiCardPick className="up-listing-placeholder" />
                  )}
                </div>

                {/* Card details */}
                <div className="up-listing-details">
                  <h3>{listing.card?.name || 'Unknown Card'}</h3>
                  <p className="up-listing-set">{listing.card?.setName}</p>
                  <div className="up-listing-meta">
                    <span className="up-listing-price">
                      ${listing.price?.toFixed(2)}
                    </span>
                    <span className="up-listing-condition">
                      {formatCondition(listing.condition)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default UserProfile;
