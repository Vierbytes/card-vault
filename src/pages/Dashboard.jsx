/**
 * Dashboard Page
 *
 * User's main dashboard showing collection summary,
 * active listings, wishlist, and matches.
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { collectionAPI, wishlistAPI, listingAPI, matchAPI } from '../services/api';
import './Dashboard.css';

function Dashboard() {
  const { user } = useAuth();

  // State for dashboard data
  const [stats, setStats] = useState({
    collectionCount: 0,
    collectionValue: 0,
    wishlistCount: 0,
    activeListings: 0,
  });
  const [matches, setMatches] = useState({ sellersWithWantedCards: [], buyersForYourCards: [] });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);

      try {
        // Fetch data in parallel
        const [collectionRes, wishlistRes, listingsRes, matchesRes] = await Promise.all([
          collectionAPI.getAll().catch(() => ({ data: { count: 0, totalValue: 0 } })),
          wishlistAPI.getAll().catch(() => ({ data: { count: 0 } })),
          listingAPI.getMine('active').catch(() => ({ data: { count: 0 } })),
          matchAPI.getMatches().catch(() => ({ data: { data: {} } })),
        ]);

        setStats({
          collectionCount: collectionRes.data.count || 0,
          collectionValue: collectionRes.data.totalValue || 0,
          wishlistCount: wishlistRes.data.count || 0,
          activeListings: listingsRes.data.count || 0,
        });

        setMatches(matchesRes.data.data || { sellersWithWantedCards: [], buyersForYourCards: [] });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="dashboard-page">
      {/* Welcome header */}
      <div className="dashboard-header">
        <h1>Welcome back, {user?.username}!</h1>
        <p>Here's what's happening with your cards</p>
      </div>

      {/* Stats cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📦</div>
          <div className="stat-content">
            <span className="stat-value">{stats.collectionCount}</span>
            <span className="stat-label">Cards in Collection</span>
          </div>
          <Link to="/collection" className="stat-link">
            View Collection →
          </Link>
        </div>

        <div className="stat-card highlight">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <span className="stat-value">${stats.collectionValue.toFixed(2)}</span>
            <span className="stat-label">Collection Value</span>
          </div>
          <Link to="/collection" className="stat-link">
            View Details →
          </Link>
        </div>

        <div className="stat-card">
          <div className="stat-icon">♡</div>
          <div className="stat-content">
            <span className="stat-value">{stats.wishlistCount}</span>
            <span className="stat-label">Wishlist Items</span>
          </div>
          <Link to="/wishlist" className="stat-link">
            View Wishlist →
          </Link>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🏷️</div>
          <div className="stat-content">
            <span className="stat-value">{stats.activeListings}</span>
            <span className="stat-label">Active Listings</span>
          </div>
          <Link to="/listings/mine" className="stat-link">
            View Listings →
          </Link>
        </div>
      </div>

      {/* Quick actions */}
      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="actions-grid">
          <Link to="/scanner" className="action-card">
            <span className="action-icon">📷</span>
            <span className="action-text">Scan a Card</span>
          </Link>
          <Link to="/listings/create" className="action-card">
            <span className="action-icon">➕</span>
            <span className="action-text">Create Listing</span>
          </Link>
          <Link to="/cards" className="action-card">
            <span className="action-icon">🔍</span>
            <span className="action-text">Browse Cards</span>
          </Link>
          <Link to="/marketplace" className="action-card">
            <span className="action-icon">🛒</span>
            <span className="action-text">Marketplace</span>
          </Link>
        </div>
      </div>

      {/* Matches section */}
      <div className="matches-section">
        <div className="section-header">
          <h2>Your Matches</h2>
          <Link to="/matches" className="section-link">
            View All →
          </Link>
        </div>

        <div className="matches-grid">
          {/* Sellers with cards you want */}
          <div className="match-card">
            <h3>🛒 Cards You Want</h3>
            <p className="match-description">Sellers offering cards from your wishlist</p>
            {loading ? (
              <div className="loading-text">Loading...</div>
            ) : matches.sellersWithWantedCards?.length > 0 ? (
              <div className="match-list">
                {matches.sellersWithWantedCards.slice(0, 3).map((match, index) => (
                  <Link
                    key={index}
                    to={`/listings/${match.listing._id}`}
                    className="match-item"
                  >
                    <span className="match-card-name">{match.card?.name}</span>
                    <span className="match-price">${match.listing?.price?.toFixed(2)}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="no-matches">No matches found. Add cards to your wishlist!</p>
            )}
          </div>

          {/* Buyers for your cards */}
          <div className="match-card">
            <h3>💵 Potential Buyers</h3>
            <p className="match-description">Users looking for cards you're selling</p>
            {loading ? (
              <div className="loading-text">Loading...</div>
            ) : matches.buyersForYourCards?.length > 0 ? (
              <div className="match-list">
                {matches.buyersForYourCards.slice(0, 3).map((match, index) => (
                  <div key={index} className="match-item">
                    <span className="match-card-name">{match.card?.name}</span>
                    <span className="match-buyer">{match.buyer?.username}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-matches">No potential buyers yet. Create some listings!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
