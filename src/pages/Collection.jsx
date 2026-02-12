/**
 * Collection Page
 *
 * This page shows the user's card collection.
 * They can view all cards they own, see total value,
 * and manage individual items (update quantity, remove).
 *
 * I learned that organizing cards in a grid with quick actions
 * makes it easy to manage a large collection.
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collectionAPI } from '../services/api';
import { FiPackage } from 'react-icons/fi';
import { GiCardPick } from 'react-icons/gi';
import useCardTilt from '../hooks/useCardTilt';
import Loader from '../components/Loader';
import './Collection.css';

function Collection() {
  // 3D tilt effect handlers for card hover
  const tiltHandlers = useCardTilt();

  // Collection data
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Stats
  const [totalValue, setTotalValue] = useState(0);
  const [totalCards, setTotalCards] = useState(0);

  // For editing quantity
  const [editingId, setEditingId] = useState(null);
  const [editQuantity, setEditQuantity] = useState(1);

  // Toast notification for actions
  const [toast, setToast] = useState(null);

  // Fetch collection on mount
  useEffect(() => {
    fetchCollection();
  }, []);

  // Recalculate stats whenever items change (edit qty, remove, etc.)
  useEffect(() => {
    const value = items.reduce((sum, item) => {
      return sum + (item.card?.currentPrice || 0) * (item.quantity || 1);
    }, 0);
    setTotalValue(Math.round(value * 100) / 100);
    setTotalCards(items.length);
  }, [items]);

  const fetchCollection = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await collectionAPI.getAll();
      const data = response.data.data || [];
      setItems(data);
      setTotalCards(response.data.count || data.length);
      setTotalValue(response.data.totalValue || 0);
    } catch (err) {
      console.error('Error fetching collection:', err);
      setError('Failed to load your collection.');
    } finally {
      setLoading(false);
    }
  };

  // Show a temporary toast message
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Update item quantity
  const handleUpdateQuantity = async (itemId) => {
    try {
      await collectionAPI.update(itemId, { quantity: editQuantity });
      // Update the local state instead of re-fetching everything
      setItems((prev) =>
        prev.map((item) =>
          item._id === itemId ? { ...item, quantity: editQuantity } : item
        )
      );
      setEditingId(null);
      showToast('Quantity updated!');
    } catch (err) {
      console.error('Error updating quantity:', err);
      showToast('Failed to update quantity', 'error');
    }
  };

  // Remove item from collection
  const handleRemove = async (itemId, cardName) => {
    // Simple confirmation before deleting
    if (!window.confirm(`Remove ${cardName} from your collection?`)) {
      return;
    }

    try {
      await collectionAPI.remove(itemId);
      setItems((prev) => prev.filter((item) => item._id !== itemId));
      setTotalCards((prev) => prev - 1);
      showToast('Card removed from collection');
    } catch (err) {
      console.error('Error removing card:', err);
      showToast('Failed to remove card', 'error');
    }
  };

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

  return (
    <div className="collection-page">
      {/* Toast notification */}
      {toast && (
        <div className={`toast ${toast.type}`}>{toast.message}</div>
      )}

      {/* Header with stats */}
      <div className="collection-header">
        <div className="header-text">
          <h1>My Collection</h1>
          <p>Manage your card collection</p>
        </div>
        <div className="collection-stats">
          <div className="stat">
            <span className="stat-number">{totalCards}</span>
            <span className="stat-label">Cards</span>
          </div>
          <div className="stat">
            <span className="stat-number">${totalValue.toFixed(2)}</span>
            <span className="stat-label">Total Value</span>
          </div>
        </div>
      </div>

      {/* Collection content */}
      {loading ? (
        <Loader message="Loading your collection..." />
      ) : error ? (
        <div className="collection-error">
          <p>{error}</p>
          <button className="btn btn-primary" onClick={fetchCollection}>
            Try Again
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="collection-empty">
          <FiPackage className="empty-icon" />
          <h3>Your collection is empty</h3>
          <p>Start by browsing cards and adding them to your collection.</p>
          <Link to="/cards" className="btn btn-primary">
            Browse Cards
          </Link>
        </div>
      ) : (
        <div className="collection-grid">
          {items.map((item) => (
            <div key={item._id} className="collection-card card-tilt" {...tiltHandlers}>
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
                  {item.quantity > 1 && (
                    <span className="quantity-badge">x{item.quantity}</span>
                  )}
                </div>
              </Link>

              <div className="card-details">
                <h3 className="card-name">{item.card?.name || 'Unknown Card'}</h3>
                <p className="card-set">{item.card?.setName}</p>

                <div className="card-meta">
                  {item.condition && (
                    <span className="condition-badge">
                      {formatCondition(item.condition)}
                    </span>
                  )}
                  <span className="card-value">
                    {item.card?.currentPrice > 0
                      ? `$${(item.card.currentPrice * (item.quantity || 1)).toFixed(2)}`
                      : 'N/A'}
                  </span>
                </div>

                {/* Quantity editing */}
                <div className="card-actions">
                  {editingId === item._id ? (
                    <div className="edit-quantity">
                      <input
                        type="number"
                        value={editQuantity}
                        onChange={(e) => setEditQuantity(parseInt(e.target.value) || 1)}
                        min="1"
                        max="99"
                      />
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => handleUpdateQuantity(item._id)}
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
                          setEditQuantity(item.quantity || 1);
                        }}
                      >
                        Edit Qty
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

export default Collection;
