/**
 * Star Rating Component
 *
 * A reusable star rating that works in two modes:
 * - Display mode (read-only): just shows the stars, used on profiles/review cards
 * - Interactive mode: clickable stars with hover preview, used in the review form
 *
 * If you pass an onRate callback, it becomes interactive.
 * If you don't, it's just a display.
 *
 * I used FiStar from react-icons for the outline and filled it with CSS
 * instead of using two different icon components. The trick is using
 * the 'filled' class to change the color and fill.
 */

import { useState } from 'react';
import { FiStar } from 'react-icons/fi';
import './StarRating.css';

function StarRating({ rating = 0, onRate, size = '1.25rem' }) {
  // hoverRating tracks which star the mouse is over (interactive mode only)
  const [hoverRating, setHoverRating] = useState(0);

  // Are we in interactive mode? Only if onRate callback is provided
  const isInteractive = typeof onRate === 'function';

  // The rating to visually display - hover takes priority over actual rating
  const displayRating = hoverRating || rating;

  return (
    <div
      className={`star-rating ${isInteractive ? 'star-rating--interactive' : ''}`}
      onMouseLeave={() => isInteractive && setHoverRating(0)}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`star ${star <= displayRating ? 'star--filled' : ''}`}
          style={{ fontSize: size }}
          onClick={() => isInteractive && onRate(star)}
          onMouseEnter={() => isInteractive && setHoverRating(star)}
          role={isInteractive ? 'button' : undefined}
          aria-label={isInteractive ? `Rate ${star} star${star > 1 ? 's' : ''}` : undefined}
        >
          <FiStar />
        </span>
      ))}
    </div>
  );
}

export default StarRating;
