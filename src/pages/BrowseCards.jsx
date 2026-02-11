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
import './BrowseCards.css';

function BrowseCards() {
  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Data state
  const [cards, setCards] = useState([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

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

  // Search for cards via TCGdex
  const searchCards = async () => {
    if (!searchQuery.trim()) return;

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
  };

  // Handle form submission
  const handleSearch = (e) => {
    e.preventDefault();
    searchCards();
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
          <button type="submit" className="btn btn-primary search-btn" disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>

      {/* Results */}
      <div className="browse-results">
        {loading ? (
          <div className="cards-grid">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="card-skeleton">
                <div className="skeleton-image"></div>
                <div className="skeleton-content">
                  <div className="skeleton-text"></div>
                  <div className="skeleton-text short"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="browse-error">
            <p>{error}</p>
            <button className="btn btn-primary" onClick={() => searchCards()}>
              Try Again
            </button>
          </div>
        ) : cards.length > 0 ? (
          <div className="cards-grid">
            {cards.map((card) => (
              <Link
                key={card.id}
                to={`/cards/${card.id}`}
                className="card-item"
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
                  {card.currentPrice ? (
                    <span className="card-price">
                      ${parseFloat(card.currentPrice).toFixed(2)}
                    </span>
                  ) : null}
                </div>
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
