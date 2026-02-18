/**
 * Review List Component
 *
 * Displays a list of seller reviews on the public profile page.
 * This is a pure display component - all the data is passed in
 * as props from UserProfile.jsx (no internal fetching).
 *
 * Shows the average rating at the top and individual review cards
 * below it. Each review shows the reviewer's name, star rating,
 * comment text, and when it was posted.
 */

import { Link } from 'react-router-dom';
import StarRating from './StarRating';
import './ReviewList.css';

function ReviewList({ reviews = [], averageRating = 0, reviewCount = 0 }) {
  // Format date the same way as the rest of the app
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="rl-section">
      <div className="rl-header">
        <h2>Seller Reviews ({reviewCount})</h2>
        {reviewCount > 0 && (
          <div className="rl-average">
            <StarRating rating={Math.round(averageRating)} size="1.1rem" />
            <span className="rl-average-number">
              {averageRating.toFixed(1)} / 5
            </span>
          </div>
        )}
      </div>

      {reviews.length === 0 ? (
        <div className="rl-empty">
          <p>No reviews yet.</p>
        </div>
      ) : (
        <div className="rl-list">
          {reviews.map((review) => (
            <div key={review._id} className="rl-card">
              {/* Reviewer info */}
              <div className="rl-card-header">
                <Link
                  to={`/users/${review.reviewer?._id}`}
                  className="rl-reviewer"
                >
                  <div className="rl-reviewer-avatar">
                    {review.reviewer?.avatar ? (
                      <img
                        src={review.reviewer.avatar}
                        alt={review.reviewer.username}
                      />
                    ) : (
                      <span className="rl-avatar-fallback">
                        {review.reviewer?.username?.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <span className="rl-reviewer-name">
                    {review.reviewer?.username}
                  </span>
                </Link>

                <span className="rl-date">{formatDate(review.createdAt)}</span>
              </div>

              {/* Star rating */}
              <div className="rl-stars">
                <StarRating rating={review.rating} size="1rem" />
              </div>

              {/* Comment text (if they wrote one) */}
              {review.comment && (
                <p className="rl-comment">{review.comment}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ReviewList;
