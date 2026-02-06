/**
 * CardGrid Component
 *
 * A reusable grid layout for displaying cards.
 * Used in marketplace, search results, collection, etc.
 */

import { Link } from 'react-router-dom';
import './CardGrid.css';

/**
 * CardItem - Single card display
 */
function CardItem({ card, showPrice = true, showSeller = false, linkTo }) {
  // Determine the link destination - all cards go to the same detail page now
  const cardLink = linkTo || `/cards/${card.externalId || card.id || card._id}`;

  // Format price with dollar sign
  const formatPrice = (price) => {
    if (price === undefined || price === null) return 'N/A';
    return `$${price.toFixed(2)}`;
  };

  // Get condition display text
  const formatCondition = (condition) => {
    const conditions = {
      near_mint: 'Near Mint',
      lightly_played: 'Lightly Played',
      moderately_played: 'Moderately Played',
      heavily_played: 'Heavily Played',
      damaged: 'Damaged',
    };
    return conditions[condition] || condition;
  };

  return (
    <Link to={cardLink} className="card-item">
      {/* Card image */}
      <div className="card-image-container">
        {card.imageUrl ? (
          <img src={card.imageUrl} alt={card.name} className="card-image" loading="lazy" />
        ) : (
          <div className="card-image-placeholder">
            <span>🃏</span>
          </div>
        )}

        {/* Game badge */}
        {card.game && <span className="card-game-badge">{card.game}</span>}
      </div>

      {/* Card info */}
      <div className="card-info">
        <h3 className="card-name">{card.name}</h3>

        {card.setName && <p className="card-set">{card.setName}</p>}

        {card.rarity && <span className="card-rarity">{card.rarity}</span>}

        {/* Price section */}
        {showPrice && (
          <div className="card-price-section">
            <span className="card-price">{formatPrice(card.currentPrice || card.price)}</span>
            {card.priceChange && (
              <span
                className={`price-change ${card.priceChange >= 0 ? 'positive' : 'negative'}`}
              >
                {card.priceChange >= 0 ? '↑' : '↓'} {Math.abs(card.priceChange).toFixed(1)}%
              </span>
            )}
          </div>
        )}

        {/* Condition (for listings) */}
        {card.condition && (
          <span className="card-condition">{formatCondition(card.condition)}</span>
        )}

        {/* Seller info (for marketplace) */}
        {showSeller && card.seller && (
          <div className="card-seller">
            <span className="seller-label">Seller:</span>
            <span className="seller-name">{card.seller.username}</span>
          </div>
        )}
      </div>
    </Link>
  );
}

/**
 * CardGrid - Grid container for cards
 */
function CardGrid({ cards, loading, emptyMessage = 'No cards found', showPrice, showSeller }) {
  if (loading) {
    return (
      <div className="card-grid-loading">
        {/* Skeleton loaders */}
        {[...Array(8)].map((_, i) => (
          <div key={i} className="card-skeleton">
            <div className="skeleton-image"></div>
            <div className="skeleton-text"></div>
            <div className="skeleton-text short"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!cards || cards.length === 0) {
    return (
      <div className="card-grid-empty">
        <span className="empty-icon">🔍</span>
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="card-grid">
      {cards.map((card) => (
        <CardItem
          key={card._id || card.id || card.externalId}
          card={card}
          showPrice={showPrice}
          showSeller={showSeller}
        />
      ))}
    </div>
  );
}

export default CardGrid;
export { CardItem };
