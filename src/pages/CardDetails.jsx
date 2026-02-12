/**
 * Card Details Page
 *
 * Shows detailed information about a specific Pokemon card from TCGdex.
 * This used to be two separate pages (one for JustTCG, one for TCGdex)
 * but now everything goes through TCGdex so I merged them into one.
 *
 * Includes: card image, details table, pricing info, price history chart,
 * action buttons (add to collection/wishlist, create listing),
 * and an animated Pokemon sprite from PokeAPI GraphQL.
 */

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { cardAPI, collectionAPI, wishlistAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import PriceChart from '../components/PriceChart';
import Loader from '../components/Loader';
import './CardDetails.css';

/**
 * Extract the base Pokemon name from a TCG card name
 *
 * TCG cards have suffixes like "V", "VMAX", "GX", "ex" etc.
 * that we need to strip to match the actual Pokemon name in PokeAPI.
 * I had to order these longest-first so "VMAX" gets removed before "V"
 * otherwise "Charizard VMAX" would become "Charizard MAX" instead of "Charizard".
 */
function extractPokemonName(cardName) {
  if (!cardName) return '';

  // TCG suffixes to remove - ordered longest first to avoid partial matches
  const suffixes = [
    'Prism Star', 'Origin Forme', 'Altered Forme',
    'VSTAR', 'VMAX', 'BREAK', 'Lv.X',
    'GX', 'EX', 'ex', 'V',
    'Radiant',
  ];

  let name = cardName;
  for (const suffix of suffixes) {
    // Escape dots for regex and remove suffix from the end of the name
    const escaped = suffix.replace(/\./g, '\\.');
    name = name.replace(new RegExp(`\\s*${escaped}\\s*$`, 'i'), '');
  }

  // Also remove the diamond symbol some promo cards have
  name = name.replace(/◇/g, '');

  // Format for PokeAPI: lowercase, spaces/dots become hyphens, strip special chars
  name = name.trim().toLowerCase().replace(/[.\s]+/g, '-').replace(/[^a-z0-9-]/g, '');

  return name;
}

function CardDetails() {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();

  // State
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Animated sprite from PokeAPI
  const [spriteData, setSpriteData] = useState(null);
  const [showShiny, setShowShiny] = useState(false);

  // Fetch card details from TCGdex
  useEffect(() => {
    const fetchCardData = async () => {
      setLoading(true);
      setError(null);

      try {
        const cardResponse = await cardAPI.getById(id);
        setCard(cardResponse.data.data);
      } catch (err) {
        console.error('Error fetching card:', err);
        setError('Failed to load card details');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchCardData();
    }
  }, [id]);

  // Fetch the animated Pokemon sprite from PokeAPI GraphQL
  // This runs after we have the card data so we can extract the Pokemon name
  useEffect(() => {
    const fetchSprite = async () => {
      if (!card?.name) return;

      const pokemonName = extractPokemonName(card.name);
      if (!pokemonName) return;

      try {
        // Using PokeAPI's GraphQL endpoint to look up the Pokemon by name
        // The _ilike operator does case-insensitive matching which is helpful
        const query = `{
          pokemon_v2_pokemon(where: {name: {_ilike: "${pokemonName}"}}, limit: 1) {
            id
            name
            pokemon_v2_pokemonsprites {
              sprites
            }
          }
        }`;

        const response = await fetch('https://beta.pokeapi.co/graphql/v1beta', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query }),
        });

        const result = await response.json();
        const pokemon = result?.data?.pokemon_v2_pokemon?.[0];

        if (pokemon && pokemon.pokemon_v2_pokemonsprites?.[0]) {
          // The sprites field can come back as either a JSON string or already-parsed object
          const rawSprites = pokemon.pokemon_v2_pokemonsprites[0].sprites;
          const sprites = typeof rawSprites === 'string' ? JSON.parse(rawSprites) : rawSprites;
          const showdown = sprites?.other?.showdown;

          if (showdown?.front_default) {
            setSpriteData({
              name: pokemon.name,
              normal: showdown.front_default,
              shiny: showdown.front_shiny || null,
            });
          }
        }
      } catch (err) {
        // Not a big deal if the sprite doesn't load - it's just a bonus feature
        console.error('Error fetching Pokemon sprite:', err);
      }
    };

    fetchSprite();
  }, [card?.name]);

  // Add to collection - sends the card data so the backend can create
  // a Card document if it doesn't exist yet in our local DB
  const handleAddToCollection = async () => {
    try {
      await collectionAPI.add({
        card: {
          externalId: card.id,
          name: card.name,
          game: 'pokemon',
          setName: card.setName,
          imageUrl: card.imageUrl,
          rarity: card.rarity,
          currentPrice: card.currentPrice,
        },
        condition: 'near_mint',
        quantity: 1,
      });
      showToast('Added to collection!');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to add to collection', 'error');
    }
  };

  // Add to wishlist - same pattern as collection
  const handleAddToWishlist = async () => {
    try {
      await wishlistAPI.add({
        card: {
          externalId: card.id,
          name: card.name,
          game: 'pokemon',
          setName: card.setName,
          imageUrl: card.imageUrl,
          rarity: card.rarity,
          currentPrice: card.currentPrice,
        },
      });
      showToast('Added to wishlist!');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to add to wishlist', 'error');
    }
  };

  if (loading) {
    return (
      <div className="card-details-page">
        <div className="loading-container">
          <Loader message="Loading card details..." />
        </div>
      </div>
    );
  }

  if (error || !card) {
    return (
      <div className="card-details-page">
        <div className="error-container">
          <h2>Card Not Found</h2>
          <p>{error || 'The card you are looking for does not exist.'}</p>
          <Link to="/cards" className="btn btn-primary">
            Browse Cards
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="card-details-page">
      <div className="card-details-content">
        {/* Left column - Card image */}
        <div className="card-image-section">
          <div className="card-image-container">
            {card.imageUrl ? (
              <img src={card.imageUrl} alt={card.name} className="card-image" />
            ) : (
              <div className="card-image-placeholder">
                <span>No Image</span>
              </div>
            )}
          </div>

          {/* Animated Pokemon sprite from PokeAPI */}
          {spriteData && (
            <div className="pokemon-sprite-section">
              <img
                src={showShiny && spriteData.shiny ? spriteData.shiny : spriteData.normal}
                alt={`${spriteData.name} sprite`}
                className="sprite-image"
              />
              <span className="sprite-label">{spriteData.name}</span>
              {spriteData.shiny && (
                <button
                  className={`shiny-toggle ${showShiny ? 'active' : ''}`}
                  onClick={() => setShowShiny(!showShiny)}
                >
                  {showShiny ? 'Normal' : 'Shiny'}
                </button>
              )}
            </div>
          )}

          {/* Action buttons - only shown when logged in */}
          {isAuthenticated && (
            <div className="card-actions">
              <button className="btn btn-secondary" onClick={handleAddToCollection}>
                + Add to Collection
              </button>
              <button className="btn btn-secondary" onClick={handleAddToWishlist}>
                + Add to Wishlist
              </button>
            </div>
          )}
        </div>

        {/* Right column - Card info */}
        <div className="card-info-section">
          {/* Card header */}
          <div className="card-header">
            <span className="card-game">Pokemon TCG</span>
            <h1 className="card-name">{card.name}</h1>
            <p className="card-set">
              {card.setName} {card.cardNumber && `#${card.cardNumber}`}
            </p>
          </div>

          {/* Price info - from TCGPlayer via TCGdex */}
          <div className="card-price-info">
            <div className="current-price">
              <span className="price-label">Market Price</span>
              <span className="price-value">
                {card.currentPrice ? `$${card.currentPrice.toFixed(2)}` : 'N/A'}
              </span>
            </div>

            {/* Pricing variants (normal, reverse holo, holofoil) */}
            {card.prices && Object.keys(card.prices).length > 0 && (
              <div className="variants-section">
                <h3>Price Variants</h3>
                <div className="variants-grid">
                  {card.prices.normal && (
                    <div className="variant-item">
                      <span className="variant-condition">Normal</span>
                      <span className="variant-price">
                        ${card.prices.normal.market?.toFixed(2) || card.prices.normal.mid?.toFixed(2) || 'N/A'}
                      </span>
                    </div>
                  )}
                  {card.prices.reverseHolo && (
                    <div className="variant-item">
                      <span className="variant-condition">Reverse Holo</span>
                      <span className="variant-price">
                        ${card.prices.reverseHolo.market?.toFixed(2) || card.prices.reverseHolo.mid?.toFixed(2) || 'N/A'}
                      </span>
                    </div>
                  )}
                  {card.prices.holofoil && (
                    <div className="variant-item">
                      <span className="variant-condition">Holofoil</span>
                      <span className="variant-price">
                        ${card.prices.holofoil.market?.toFixed(2) || card.prices.holofoil.mid?.toFixed(2) || 'N/A'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Card details table */}
          <div className="card-details-table">
            <h3>Card Details</h3>
            <table>
              <tbody>
                <tr>
                  <td>Set</td>
                  <td>{card.setName || 'Unknown'}</td>
                </tr>
                {card.cardNumber && (
                  <tr>
                    <td>Card Number</td>
                    <td>{card.cardNumber}</td>
                  </tr>
                )}
                {card.rarity && (
                  <tr>
                    <td>Rarity</td>
                    <td>{card.rarity}</td>
                  </tr>
                )}
                {card.hp && (
                  <tr>
                    <td>HP</td>
                    <td>{card.hp}</td>
                  </tr>
                )}
                {card.types && card.types.length > 0 && (
                  <tr>
                    <td>Type</td>
                    <td>{card.types.join(', ')}</td>
                  </tr>
                )}
                {card.illustrator && (
                  <tr>
                    <td>Illustrator</td>
                    <td>{card.illustrator}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Description if available */}
          {card.description && (
            <div className="card-description">
              <h3>Description</h3>
              <p>{card.description}</p>
            </div>
          )}
        </div>
      </div>

      {/* Price history chart */}
      <section className="price-history-section">
        <h2>Price History</h2>
        <PriceChart cardId={id} duration="30d" />
      </section>

      {/* Source credit */}
      <p className="source-credit">
        Card data provided by{' '}
        <a href="https://tcgdex.dev" target="_blank" rel="noopener noreferrer">
          TCGdex
        </a>
        {spriteData && (
          <>
            {' · Sprites from '}
            <a href="https://pokeapi.co" target="_blank" rel="noopener noreferrer">
              PokeAPI
            </a>
          </>
        )}
      </p>
    </div>
  );
}

export default CardDetails;
