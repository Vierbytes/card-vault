/**
 * Marketplace Page
 *
 * Shows all active listings with filters.
 * Based on the wireframe with left sidebar filters.
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { listingAPI, cardAPI } from '../services/api';
import './Marketplace.css';

function Marketplace() {
  // State for listings and loading
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter state
  const [filters, setFilters] = useState({
    game: '',
    minPrice: '',
    maxPrice: '',
    condition: '',
  });

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Mobile filter toggle
  const [showFilters, setShowFilters] = useState(false);

  // Available games for filter dropdown
  const [games, setGames] = useState([]);

  // Fetch games for filter
  useEffect(() => {
    const fetchGames = async () => {
      try {
        const response = await cardAPI.getGames();
        setGames(response.data.data || []);
      } catch (err) {
        console.error('Error fetching games:', err);
      }
    };
    fetchGames();
  }, []);

  // Fetch listings when filters or page changes
  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = {
          page,
          limit: 20,
        };

        // Add filters if set
        if (filters.game) params.game = filters.game;
        if (filters.minPrice) params.minPrice = filters.minPrice;
        if (filters.maxPrice) params.maxPrice = filters.maxPrice;
        if (filters.condition) params.condition = filters.condition;

        const response = await listingAPI.getAll(params);
        setListings(response.data.data || []);
        setTotalPages(response.data.pages || 1);
      } catch (err) {
        console.error('Error fetching listings:', err);
        setError('Failed to load listings');
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, [filters, page]);

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
    setPage(1); // Reset to first page when filters change
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      game: '',
      minPrice: '',
      maxPrice: '',
      condition: '',
    });
    setPage(1);
  };

  // Format condition for display
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

  return (
    <div className="marketplace-page">
      {/* Header */}
      <div className="marketplace-header">
        <h1>Marketplace</h1>
        <p>Browse cards for sale from collectors</p>
        <button
          className="btn btn-secondary mobile-filter-btn"
          onClick={() => setShowFilters(!showFilters)}
        >
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </button>
      </div>

      <div className="marketplace-content">
        {/* Filters sidebar */}
        <aside className={`filters-sidebar ${showFilters ? 'show' : ''}`}>
          <div className="filters-header">
            <h3>Filters</h3>
            <button className="clear-filters" onClick={clearFilters}>
              Clear All
            </button>
          </div>

          {/* Game filter */}
          <div className="filter-group">
            <label>Game</label>
            <select name="game" value={filters.game} onChange={handleFilterChange}>
              <option value="">All Games</option>
              {games.map((game) => (
                <option key={game.id || game.name} value={game.id || game.name}>
                  {game.name}
                </option>
              ))}
            </select>
          </div>

          {/* Price range */}
          <div className="filter-group">
            <label>Price Range</label>
            <div className="price-inputs">
              <input
                type="number"
                name="minPrice"
                value={filters.minPrice}
                onChange={handleFilterChange}
                placeholder="Min"
                min="0"
              />
              <span>to</span>
              <input
                type="number"
                name="maxPrice"
                value={filters.maxPrice}
                onChange={handleFilterChange}
                placeholder="Max"
                min="0"
              />
            </div>
          </div>

          {/* Condition filter */}
          <div className="filter-group">
            <label>Condition</label>
            <select name="condition" value={filters.condition} onChange={handleFilterChange}>
              <option value="">Any Condition</option>
              <option value="near_mint">Near Mint</option>
              <option value="lightly_played">Lightly Played</option>
              <option value="moderately_played">Moderately Played</option>
              <option value="heavily_played">Heavily Played</option>
              <option value="damaged">Damaged</option>
            </select>
          </div>
        </aside>

        {/* Listings grid */}
        <main className="listings-main">
          {loading ? (
            <div className="listings-loading">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="listing-skeleton">
                  <div className="skeleton-image"></div>
                  <div className="skeleton-content">
                    <div className="skeleton-text"></div>
                    <div className="skeleton-text short"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="listings-error">
              <p>{error}</p>
              <button className="btn btn-primary" onClick={() => setPage(1)}>
                Try Again
              </button>
            </div>
          ) : listings.length === 0 ? (
            <div className="listings-empty">
              <span className="empty-icon">🔍</span>
              <h3>No listings found</h3>
              <p>Try adjusting your filters or check back later.</p>
            </div>
          ) : (
            <>
              <div className="listings-grid">
                {listings.map((listing) => (
                  <Link
                    key={listing._id}
                    to={`/listings/${listing._id}`}
                    className="listing-card"
                  >
                    <div className="listing-image">
                      {listing.card?.imageUrl ? (
                        <img src={listing.card.imageUrl} alt={listing.card.name} />
                      ) : (
                        <span className="placeholder">🃏</span>
                      )}
                      {listing.card?.game && (
                        <span className="game-badge">{listing.card.game}</span>
                      )}
                    </div>
                    <div className="listing-details">
                      <h3 className="listing-name">{listing.card?.name || 'Unknown Card'}</h3>
                      <p className="listing-set">{listing.card?.setName}</p>
                      <div className="listing-meta">
                        <span className="listing-price">${listing.price?.toFixed(2)}</span>
                        <span className="listing-condition">
                          {formatCondition(listing.condition)}
                        </span>
                      </div>
                      <div className="listing-seller">
                        <span className="seller-avatar">
                          {listing.seller?.username?.charAt(0).toUpperCase()}
                        </span>
                        <span className="seller-name">{listing.seller?.username}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    className="btn btn-secondary"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </button>
                  <span className="page-info">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default Marketplace;
