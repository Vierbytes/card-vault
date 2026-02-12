/**
 * Browse Cards Page
 *
 * This page lets users search for Pokemon cards using TCGdex.
 * I simplified this a lot - it used to have a toggle between JustTCG
 * and TCGdex, plus game/set filter dropdowns. Now everything goes
 * through TCGdex which gives us reliable card images AND pricing.
 *
 * On first load, it shows random featured cards so the page isn't empty.
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { cardAPI } from '../services/api';
import useCardTilt from '../hooks/useCardTilt';
import Loader from '../components/Loader';
import './BrowseCards.css';

function BrowseCards() {
  // 3D tilt effect handlers for card hover
  const tiltHandlers = useCardTilt();

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Data state
  const [cards, setCards] = useState([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Load some random Pokemon cards on mount so the page isn't empty
  useEffect(() => {
    const loadFeatured = async () => {
      setLoading(true);
      try {
        const response = await cardAPI.random(12);
        setCards(response.data.data || []);
        setHasSearched(true);
      } catch (err) {
        console.error('Error loading featured cards:', err);
      } finally {
        setLoading(false);
      }
    };
    loadFeatured();
  }, []);

  // Live search - debounce API calls so we don't fire on every keystroke
  // Waits 300ms after the user stops typing before searching
  useEffect(() => {
    // Don't search if query is too short
    if (searchQuery.trim().length < 2) return;

    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      setHasSearched(true);

      try {
        const response = await cardAPI.search({
          q: searchQuery.trim(),
          limit: 20,
        });
        setCards(response.data.data || []);
      } catch (err) {
        console.error('Error searching cards:', err);
        setError('Failed to search cards. Please try again.');
      } finally {
        setLoading(false);
      }
    }, 300);

    // Cleanup: cancel the timer if the user keeps typing
    return () => clearTimeout(timer);
  }, [searchQuery, retryCount]);

  // Handle form submission (still works for pressing Enter)
  const handleSearch = (e) => {
    e.preventDefault();
  };

  return (
    <div className="browse-page">
      {/* Search header */}
      <div className="browse-header">
        <h1>Browse Cards</h1>
        <p>Search Pokemon trading cards with high-quality images</p>
      </div>

      {/* Search form */}
      <form className="search-form" onSubmit={handleSearch}>
        <div className="search-bar">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Pokemon cards by name..."
            className="search-input"
          />
          <button type="submit" className="btn btn-primary search-btn">
            Search
          </button>
        </div>
      </form>

      {/* Results */}
      <div className="browse-results">
        {loading ? (
          <Loader message="Loading cards..." />
        ) : error ? (
          <div className="browse-error">
            <p>{error}</p>
            <button className="btn btn-primary" onClick={() => setRetryCount((c) => c + 1)}>
              Try Again
            </button>
          </div>
        ) : cards.length > 0 ? (
          <div className="cards-grid">
            {cards.map((card) => (
              <Link
                key={card.id}
                to={`/cards/${card.id}`}
                className="card-item card-tilt"
                {...tiltHandlers}
              >
                <div className="card-image">
                  {card.imageUrl ? (
                    <img src={card.imageUrl} alt={card.name} />
                  ) : (
                    <span className="card-placeholder">No Image</span>
                  )}
                </div>
                <div className="card-info">
                  <h3 className="card-name">{card.name}</h3>
                  <p className="card-set">{card.setName}</p>
                  {card.rarity && <span className="card-rarity">{card.rarity}</span>}
                  <span className="card-price">
                    {card.currentPrice
                      ? `$${parseFloat(card.currentPrice).toFixed(2)}`
                      : 'N/A'}
                  </span>
                </div>
                <div className="light-shadow" />
              </Link>
            ))}
          </div>
        ) : hasSearched ? (
          <div className="browse-empty">
            <h3>No cards found</h3>
            <p>Try different search terms.</p>
          </div>
        ) : (
          <div className="browse-initial">
            <h3>Search for cards</h3>
            <p>Enter a Pokemon card name to start browsing.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default BrowseCards;
