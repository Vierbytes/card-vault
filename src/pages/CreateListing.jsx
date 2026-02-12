/**
 * Create Listing Page
 *
 * This page lets users create a new marketplace listing.
 * The user first searches for a card, selects it, then sets
 * condition and price. I found this two-step approach makes
 * it easier than filling out a big form all at once.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cardAPI, listingAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import { GiCardPick } from 'react-icons/gi';
import useCardTilt from '../hooks/useCardTilt';
import './CreateListing.css';

function CreateListing() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  // 3D tilt effect handlers for card hover
  const tiltHandlers = useCardTilt();

  // Step tracking - step 1: search card, step 2: set details
  const [step, setStep] = useState(1);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Selected card
  const [selectedCard, setSelectedCard] = useState(null);

  // Listing details
  const [condition, setCondition] = useState('near_mint');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');

  // Form state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Search for cards
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearchLoading(true);
    setError(null);

    try {
      const response = await cardAPI.search({ q: searchQuery.trim(), limit: 12 });
      setSearchResults(response.data.data || []);
    } catch (err) {
      console.error('Error searching cards:', err);
      setError('Failed to search cards');
    } finally {
      setSearchLoading(false);
    }
  };

  // Select a card and move to step 2
  const selectCard = (card) => {
    setSelectedCard(card);
    setStep(2);
    // Pre-fill price with market price if available
    if (card.price) {
      setPrice(parseFloat(card.price).toFixed(2));
    }
  };

  // Submit the listing
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!price || parseFloat(price) <= 0) {
      setError('Please enter a valid price');
      return;
    }

    setSubmitting(true);

    try {
      const listingData = {
        card: {
          externalId: selectedCard.id || selectedCard._id,
          name: selectedCard.name,
          game: selectedCard.game,
          setName: selectedCard.setName || selectedCard.set,
          imageUrl: selectedCard.imageUrl || selectedCard.image,
          rarity: selectedCard.rarity,
        },
        condition,
        price: parseFloat(price),
        description: description.trim(),
      };

      await listingAPI.create(listingData);
      showToast('Listing created!');
      // Redirect to my listings page after success
      navigate('/listings/mine');
    } catch (err) {
      console.error('Error creating listing:', err);
      setError(err.response?.data?.message || 'Failed to create listing');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="create-listing-page">
      <div className="create-header">
        <h1>Create a Listing</h1>
        <p>Sell a card from your collection</p>
      </div>

      {/* Step indicator */}
      <div className="steps">
        <div className={`step ${step >= 1 ? 'active' : ''}`}>
          <span className="step-number">1</span>
          <span className="step-label">Select Card</span>
        </div>
        <div className="step-connector"></div>
        <div className={`step ${step >= 2 ? 'active' : ''}`}>
          <span className="step-number">2</span>
          <span className="step-label">Set Details</span>
        </div>
      </div>

      {error && <div className="error-box">{error}</div>}

      {/* Step 1: Search and select a card */}
      {step === 1 && (
        <div className="step-content">
          <form className="card-search-form" onSubmit={handleSearch}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for a card to list..."
              className="search-input"
            />
            <button type="submit" className="btn btn-primary" disabled={searchLoading}>
              {searchLoading ? 'Searching...' : 'Search'}
            </button>
          </form>

          {searchResults.length > 0 && (
            <div className="search-results">
              <h3>Select a card:</h3>
              <div className="results-grid">
                {searchResults.map((card) => (
                  <button
                    key={card.id || card._id}
                    className="result-card card-tilt"
                    onClick={() => selectCard(card)}
                    {...tiltHandlers}
                  >
                    <div className="result-image">
                      {card.imageUrl || card.image ? (
                        <img src={card.imageUrl || card.image} alt={card.name} />
                      ) : (
                        <GiCardPick className="result-placeholder" />
                      )}
                    </div>
                    <div className="result-info">
                      <span className="result-name">{card.name}</span>
                      <span className="result-set">{card.setName || card.set}</span>
                      <span className="result-price">
                        {card.price
                          ? `$${parseFloat(card.price).toFixed(2)}`
                          : 'N/A'}
                      </span>
                    </div>
                    <div className="light-shadow" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Set listing details */}
      {step === 2 && selectedCard && (
        <div className="step-content">
          <div className="listing-form-layout">
            {/* Selected card preview */}
            <div className="selected-card-preview">
              <div className="preview-image">
                {selectedCard.imageUrl || selectedCard.image ? (
                  <img src={selectedCard.imageUrl || selectedCard.image} alt={selectedCard.name} />
                ) : (
                  <GiCardPick className="preview-placeholder" />
                )}
              </div>
              <h3>{selectedCard.name}</h3>
              <p>{selectedCard.setName || selectedCard.set}</p>
              <button className="btn btn-sm btn-secondary" onClick={() => setStep(1)}>
                Change Card
              </button>
            </div>

            {/* Listing details form */}
            <form className="listing-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="condition">Condition</label>
                <select
                  id="condition"
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                >
                  <option value="near_mint">Near Mint</option>
                  <option value="lightly_played">Lightly Played</option>
                  <option value="moderately_played">Moderately Played</option>
                  <option value="heavily_played">Heavily Played</option>
                  <option value="damaged">Damaged</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="price">Price ($)</label>
                <input
                  type="number"
                  id="price"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  min="0.01"
                  step="0.01"
                  required
                />
                {selectedCard.price && (
                  <span className="price-hint">
                    Market price: ${parseFloat(selectedCard.price).toFixed(2)}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="description">Description (optional)</label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Any additional details about the card..."
                  rows="3"
                  maxLength="500"
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-lg submit-btn"
                disabled={submitting}
              >
                {submitting ? 'Creating Listing...' : 'Create Listing'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CreateListing;
