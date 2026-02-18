/**
 * Marketplace Page
 *
 * Shows all active listings with filters and search.
 * Left sidebar has filters: search, sort, price range, condition,
 * rarity, and set name. The search input is debounced so it doesn't
 * fire a request on every keystroke - waits 400ms after the user
 * stops typing before fetching.
 *
 * The rarity and set name dropdowns are populated dynamically from
 * the backend - it only shows options that have active listings.
 * This way users don't pick a rarity and get zero results.
 */

import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { listingAPI } from '../services/api';
import { FiSearch } from 'react-icons/fi';
import { GiCardPick } from 'react-icons/gi';
import useCardTilt from '../hooks/useCardTilt';
import Loader from '../components/Loader';
import './Marketplace.css';

function Marketplace() {
  // 3D tilt effect handlers for card hover
  const tiltHandlers = useCardTilt();

  // State for listings and loading
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter state - replaced game with search, sort, rarity, setName
  const [filters, setFilters] = useState({
    search: '',
    sort: '-createdAt',
    minPrice: '',
    maxPrice: '',
    condition: '',
    rarity: '',
    setName: '',
  });

  // The actual search value that gets sent to the API
  // This is separate from the input value so we can debounce it
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const searchTimerRef = useRef(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Mobile filter toggle
  const [showFilters, setShowFilters] = useState(false);

  // Filter options from the backend (rarity values, set names)
  const [filterOptions, setFilterOptions] = useState({
    rarities: [],
    setNames: [],
  });

  // Fetch filter options on mount so the dropdowns are populated
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const response = await listingAPI.getFilters();
        setFilterOptions(response.data.data || { rarities: [], setNames: [] });
      } catch (err) {
        console.error('Error fetching filter options:', err);
      }
    };
    fetchFilterOptions();
  }, []);

  // Debounce the search input - wait 400ms after the user stops typing
  // before updating debouncedSearch which triggers the API call
  useEffect(() => {
    // Clear any existing timer so we don't fire old searches
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(filters.search);
    }, 400);

    // Cleanup on unmount
    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, [filters.search]);

  // Fetch listings when filters or page changes
  // Uses debouncedSearch instead of filters.search so it waits for typing
  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = {
          page,
          limit: 20,
          sort: filters.sort,
        };

        // Only add filters that are set (avoid empty query params)
        if (debouncedSearch) params.search = debouncedSearch;
        if (filters.minPrice) params.minPrice = filters.minPrice;
        if (filters.maxPrice) params.maxPrice = filters.maxPrice;
        if (filters.condition) params.condition = filters.condition;
        if (filters.rarity) params.rarity = filters.rarity;
        if (filters.setName) params.setName = filters.setName;

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
  }, [debouncedSearch, filters.sort, filters.minPrice, filters.maxPrice, filters.condition, filters.rarity, filters.setName, page]);

  // Handle filter changes - works for all inputs/selects
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Reset to first page when any filter changes (except search, which
    // resets via the debounced effect)
    if (name !== 'search') {
      setPage(1);
    }
  };

  // Reset page when debounced search changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  // Clear all filters back to defaults
  const clearFilters = () => {
    setFilters({
      search: '',
      sort: '-createdAt',
      minPrice: '',
      maxPrice: '',
      condition: '',
      rarity: '',
      setName: '',
    });
    setDebouncedSearch('');
    setPage(1);
  };

  // Count how many filters are active (for the mobile button)
  const activeFilterCount = [
    filters.search,
    filters.minPrice,
    filters.maxPrice,
    filters.condition,
    filters.rarity,
    filters.setName,
    filters.sort !== '-createdAt' ? filters.sort : '',
  ].filter(Boolean).length;

  // Format condition enum values for display
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
          {showFilters ? 'Hide Filters' : `Show Filters${activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}`}
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

          {/* Search by card name */}
          <div className="filter-group">
            <label>Search Cards</label>
            <div className="search-input-wrapper">
              <FiSearch className="search-icon" />
              <input
                type="text"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Card name..."
                className="search-input"
              />
            </div>
          </div>

          {/* Sort by */}
          <div className="filter-group">
            <label>Sort By</label>
            <select name="sort" value={filters.sort} onChange={handleFilterChange}>
              <option value="-createdAt">Newest First</option>
              <option value="price">Price: Low to High</option>
              <option value="-price">Price: High to Low</option>
              <option value="-viewCount">Most Viewed</option>
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

          {/* Rarity filter - populated from active listings */}
          <div className="filter-group">
            <label>Rarity</label>
            <select name="rarity" value={filters.rarity} onChange={handleFilterChange}>
              <option value="">All Rarities</option>
              {filterOptions.rarities.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Set name filter - populated from active listings */}
          <div className="filter-group">
            <label>Set</label>
            <select name="setName" value={filters.setName} onChange={handleFilterChange}>
              <option value="">All Sets</option>
              {filterOptions.setNames.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </aside>

        {/* Listings grid */}
        <main className="listings-main">
          {loading ? (
            <Loader message="Loading listings..." />
          ) : error ? (
            <div className="listings-error">
              <p>{error}</p>
              <button className="btn btn-primary" onClick={() => setPage(1)}>
                Try Again
              </button>
            </div>
          ) : listings.length === 0 ? (
            <div className="listings-empty">
              <FiSearch className="empty-icon" />
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
                    className="listing-card card-tilt"
                    {...tiltHandlers}
                  >
                    <div className="listing-image">
                      {listing.card?.imageUrl ? (
                        <img src={listing.card.imageUrl} alt={listing.card.name} />
                      ) : (
                        <GiCardPick className="placeholder" />
                      )}
                      {listing.card?.rarity && (
                        <span className="game-badge">{listing.card.rarity}</span>
                      )}
                    </div>
                    <div className="listing-details">
                      <h3 className="listing-name">{listing.card?.name || 'Unknown Card'}</h3>
                      <p className="listing-set">{listing.card?.setName}</p>
                      <div className="listing-meta">
                        <span className="listing-price">
                          {listing.price ? `$${listing.price.toFixed(2)}` : 'N/A'}
                        </span>
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
                    <div className="light-shadow" />
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
