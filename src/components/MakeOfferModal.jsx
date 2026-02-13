/**
 * Make Offer Modal
 *
 * A reusable modal that lets users submit an offer on a listing.
 * Used from both the ListingDetails page and the Matches page.
 *
 * I learned that stopping event propagation on the inner div
 * prevents clicks inside the modal from closing it, while clicking
 * the dark overlay behind it still closes it. Pretty neat trick.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { tradeOfferAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import { GiCardPick } from 'react-icons/gi';
import './MakeOfferModal.css';

function MakeOfferModal({ listing, onClose }) {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [offeredPrice, setOfferedPrice] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    const price = parseFloat(offeredPrice);
    if (!price || price <= 0) {
      showToast('Please enter a valid price', 'error');
      return;
    }

    setSubmitting(true);

    try {
      await tradeOfferAPI.create({
        listingId: listing._id,
        offeredPrice: price,
        initialMessage: message,
      });

      showToast('Offer sent!');
      onClose();
      navigate('/offers');
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to send offer';
      showToast(errorMsg, 'error');
    }

    setSubmitting(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content offer-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Make an Offer</h2>

        {/* Card info summary */}
        <div className="offer-card-summary">
          <div className="offer-card-thumb">
            {listing.card?.imageUrl ? (
              <img src={listing.card.imageUrl} alt={listing.card?.name} />
            ) : (
              <GiCardPick className="thumb-placeholder" />
            )}
          </div>
          <div className="offer-card-info">
            <h3>{listing.card?.name || 'Unknown Card'}</h3>
            <p className="offer-listing-price">
              Asking price: <strong>${listing.price?.toFixed(2)}</strong>
            </p>
          </div>
        </div>

        {/* Offer form */}
        <form onSubmit={handleSubmit} className="offer-form">
          <div className="form-group">
            <label htmlFor="offeredPrice">Your Offer ($)</label>
            <input
              type="number"
              id="offeredPrice"
              value={offeredPrice}
              onChange={(e) => setOfferedPrice(e.target.value)}
              placeholder="0.00"
              min="0.01"
              step="0.01"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="offerMessage">Message to Seller (optional)</label>
            <textarea
              id="offerMessage"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Anything you'd like the seller to know..."
              maxLength={500}
              rows={3}
            />
          </div>

          <div className="offer-modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Sending...' : 'Send Offer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default MakeOfferModal;
