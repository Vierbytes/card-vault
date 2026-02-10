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
import './Wishlist.css';

function Wishlist() {
  // Wishlist data
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // For editing max price
  const [editingId, setEditingId] = useState(null);
  const [editMaxPrice, setEditMaxPrice] = useState('');

  // Toast notification
  const [toast, setToast] = useState(null);

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

  // Show a temporary toast message
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
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
      {/* Toast notification */}
      {toast && (
        <div className={`toast ${toast.type}`}>{toast.message}</div>
      )}

      {/* Header */}
      <div className="wishlist-header">
        <div className="header-text">
          <h1>My Wishlist</h1>
          <p>Cards you're looking for — we'll match you with sellers</p>
        </div>
        <div className="wishlist-count">
          <span className="count-number">{items.length}</span>
          <span className="count-label">Cards Wanted</span>
        </div>
      </div>

      {/* Wishlist content */}
      {loading ? (
        <div className="wishlist-grid">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="wishlist-skeleton">
              <div className="skeleton-image"></div>
              <div className="skeleton-content">
                <div className="skeleton-text"></div>
                <div className="skeleton-text short"></div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="wishlist-error">
          <p>{error}</p>
          <button className="btn btn-primary" onClick={fetchWishlist}>
            Try Again
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="wishlist-empty">
          <span className="empty-icon">♡</span>
          <h3>Your wishlist is empty</h3>
          <p>Browse cards and add ones you want to your wishlist.</p>
          <Link to="/cards" className="btn btn-primary">
            Browse Cards
          </Link>
        </div>
      ) : (
        <div className="wishlist-grid">
          {items.map((item) => (
            <div key={item._id} className="wishlist-card">
              <Link to={`/cards/${item.card?.externalId || item.card?._id}`} className="card-link">
                <div className="card-image">
                  {item.card?.imageUrl ? (
                    <img src={item.card.imageUrl} alt={item.card.name} />
                  ) : (
                    <span className="card-placeholder">🃏</span>
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
                  {item.card?.price && (
                    <div className="market-price">
                      <span className="price-label">Market:</span>
                      <span className="price-value">${parseFloat(item.card.price).toFixed(2)}</span>
                    </div>
                  )}
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Wishlist;
