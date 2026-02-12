/**
 * Wishlist Page
 *
 * Shows cards the user wants to acquire.
 * This is key for the matching feature - when someone lists
 * a card that's on your wishlist, we can notify you.
 *
 * I kept the layout similar to the Collection page so it feels
 * consistent, but with different action buttons.
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { wishlistAPI } from '../services/api';
import { FiHeart } from 'react-icons/fi';
import { GiCardPick } from 'react-icons/gi';
import useCardTilt from '../hooks/useCardTilt';
import { useToast } from '../context/ToastContext';
import Loader from '../components/Loader';
import './Wishlist.css';

function Wishlist() {
  // 3D tilt effect handlers for card hover
  const tiltHandlers = useCardTilt();
  const { showToast } = useToast();

  // Wishlist data
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // For editing max price
  const [editingId, setEditingId] = useState(null);
  const [editMaxPrice, setEditMaxPrice] = useState('');

  // Fetch wishlist on mount
  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await wishlistAPI.getAll();
      setItems(response.data.data || []);
    } catch (err) {
      console.error('Error fetching wishlist:', err);
      setError('Failed to load your wishlist.');
    } finally {
      setLoading(false);
    }
  };

  // Update item's max price (what user is willing to pay)
  const handleUpdateMaxPrice = async (itemId) => {
    try {
      await wishlistAPI.update(itemId, { maxPrice: parseFloat(editMaxPrice) || 0 });
      setItems((prev) =>
        prev.map((item) =>
          item._id === itemId
            ? { ...item, maxPrice: parseFloat(editMaxPrice) || 0 }
            : item
        )
      );
      setEditingId(null);
      showToast('Max price updated!');
    } catch (err) {
      console.error('Error updating max price:', err);
      showToast('Failed to update', 'error');
    }
  };

  // Remove item from wishlist
  const handleRemove = async (itemId, cardName) => {
    if (!window.confirm(`Remove ${cardName} from your wishlist?`)) {
      return;
    }

    try {
      await wishlistAPI.remove(itemId);
      setItems((prev) => prev.filter((item) => item._id !== itemId));
      showToast('Removed from wishlist');
    } catch (err) {
      console.error('Error removing from wishlist:', err);
      showToast('Failed to remove', 'error');
    }
  };

  return (
    <div className="wishlist-page">
      {/* Header */}
      <div className="wishlist-header">
        <div className="header-text">
          <h1>My Wishlist</h1>
          <p>Cards you're looking for... We'll match you with sellers</p>
        </div>
        <div className="wishlist-count">
          <span className="count-number">{items.length}</span>
          <span className="count-label">Cards Wanted</span>
        </div>
      </div>

      {/* Wishlist content */}
      {loading ? (
        <Loader message="Loading your wishlist..." />
      ) : error ? (
        <div className="wishlist-error">
          <p>{error}</p>
          <button className="btn btn-primary" onClick={fetchWishlist}>
            Try Again
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="wishlist-empty">
          <FiHeart className="empty-icon" />
          <h3>Your wishlist is empty</h3>
          <p>Browse cards and add ones you want to your wishlist.</p>
          <Link to="/cards" className="btn btn-primary">
            Browse Cards
          </Link>
        </div>
      ) : (
        <div className="wishlist-grid">
          {items.map((item) => (
            <div key={item._id} className="wishlist-card card-tilt" {...tiltHandlers}>
              <Link to={`/cards/${item.card?.externalId || item.card?._id}`} className="card-link">
                <div className="card-image">
                  {item.card?.imageUrl ? (
                    <img src={item.card.imageUrl} alt={item.card.name} />
                  ) : (
                    <GiCardPick className="card-placeholder" />
                  )}
                  {item.card?.game && (
                    <span className="game-badge">{item.card.game}</span>
                  )}
                </div>
              </Link>

              <div className="card-details">
                <h3 className="card-name">{item.card?.name || 'Unknown Card'}</h3>
                <p className="card-set">{item.card?.setName}</p>

                <div className="card-pricing">
                  <div className="market-price">
                    <span className="price-label">Market:</span>
                    <span className="price-value">
                      {item.card?.price
                        ? `$${parseFloat(item.card.price).toFixed(2)}`
                        : 'N/A'}
                    </span>
                  </div>
                  {item.maxPrice > 0 && (
                    <div className="max-price">
                      <span className="price-label">Max:</span>
                      <span className="price-value">${item.maxPrice.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="card-actions">
                  {editingId === item._id ? (
                    <div className="edit-price">
                      <input
                        type="number"
                        value={editMaxPrice}
                        onChange={(e) => setEditMaxPrice(e.target.value)}
                        placeholder="Max $"
                        min="0"
                        step="0.01"
                      />
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => handleUpdateMaxPrice(item._id)}
                      >
                        Save
                      </button>
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="action-buttons">
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => {
                          setEditingId(item._id);
                          setEditMaxPrice(item.maxPrice?.toString() || '');
                        }}
                      >
                        Set Max $
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleRemove(item._id, item.card?.name)}
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="light-shadow" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Wishlist;
