/**
 * Review Form Modal
 *
 * A modal that lets buyers leave a rating and optional comment
 * after a completed transaction. Follows the same modal pattern
 * as MakeOfferModal - dark overlay click to close, inner content
 * stops propagation.
 *
 * I reused the modal-overlay and modal-content CSS classes from
 * MakeOfferModal since they're already styled for the app's theme.
 */

import { useState } from 'react';
import { reviewAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import { GiCardPick } from 'react-icons/gi';
import StarRating from './StarRating';
import './ReviewForm.css';

function ReviewForm({ transaction, onClose, onReviewSubmitted }) {
  const { showToast } = useToast();

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Need at least a rating
    if (rating === 0) {
      showToast('Please select a star rating', 'error');
      return;
    }

    setSubmitting(true);

    try {
      await reviewAPI.create({
        transactionId: transaction._id,
        rating,
        comment,
      });

      showToast('Review submitted!');
      onReviewSubmitted();
      onClose();
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to submit review';
      showToast(errorMsg, 'error');
    }

    setSubmitting(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content review-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Leave a Review</h2>

        {/* Transaction summary so the user knows what they're reviewing */}
        <div className="review-summary">
          <div className="review-card-thumb">
            {transaction.card?.imageUrl ? (
              <img src={transaction.card.imageUrl} alt={transaction.card?.name} />
            ) : (
              <GiCardPick className="thumb-placeholder" />
            )}
          </div>
          <div className="review-card-info">
            <h3>{transaction.card?.name || 'Unknown Card'}</h3>
            <p className="review-seller-name">
              Seller: <strong>{transaction.seller?.username}</strong>
            </p>
            <p className="review-amount">
              Paid: <strong>${transaction.amount?.toFixed(2)}</strong>
            </p>
          </div>
        </div>

        {/* Review form */}
        <form onSubmit={handleSubmit} className="review-form">
          {/* Star rating selector */}
          <div className="form-group">
            <label>Your Rating</label>
            <div className="review-stars-wrapper">
              <StarRating rating={rating} onRate={setRating} size="1.75rem" />
              {rating > 0 && (
                <span className="review-rating-label">
                  {rating === 1 && 'Poor'}
                  {rating === 2 && 'Fair'}
                  {rating === 3 && 'Good'}
                  {rating === 4 && 'Great'}
                  {rating === 5 && 'Excellent'}
                </span>
              )}
            </div>
          </div>

          {/* Optional comment */}
          <div className="form-group">
            <label htmlFor="reviewComment">Comment (optional)</label>
            <textarea
              id="reviewComment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="How was your experience with this seller?"
              maxLength={500}
              rows={3}
            />
            <span className="review-char-count">{comment.length}/500</span>
          </div>

          {/* Action buttons */}
          <div className="review-modal-actions">
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
              disabled={submitting || rating === 0}
            >
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ReviewForm;
