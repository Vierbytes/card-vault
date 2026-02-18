/**
 * Card Details Page
 *
 * Shows detailed information about a specific Pokemon card from TCGdex.
 * This used to be two separate pages (one for JustTCG, one for TCGdex)
 * but now everything goes through TCGdex so I merged them into one.
 *
 * I also added card mechanics data from the Pokemon TCG API (pokemontcg.io)
 * which gives us attacks, abilities, weaknesses, resistances, retreat cost,
 * evolution info, legalities, and flavor text. The mechanics data is optional
 * so the page still works fine if that API call fails.
 *
 * Includes: card image, details table, pricing info, price history chart,
 * action buttons (add to collection/wishlist, create listing),
 * card mechanics (attacks, abilities, combat info),
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

// Energy type icons - these are the official Pokemon TCG energy symbols
// The API returns names like "Fire", "Lightning", "Darkness" but the icon files
// use slightly different names so I need this mapping to connect them
import fireIcon from '../assets/energy/fire-en.png';
import waterIcon from '../assets/energy/water-en.png';
import grassIcon from '../assets/energy/grass-en.png';
import electricIcon from '../assets/energy/electric-en.png';
import psychicIcon from '../assets/energy/psychic-en.png';
import fightingIcon from '../assets/energy/fighting-en.png';
import darkIcon from '../assets/energy/dark-en.png';
import steelIcon from '../assets/energy/steel-en.png';
import dragonIcon from '../assets/energy/dragon-en.png';
import colorlessIcon from '../assets/energy/colorless-en.png';

// Map the energy type string from the API to the matching icon file
// Some types have different names in the API vs the file names:
// "Lightning" -> electric, "Darkness" -> dark, "Metal" -> steel
// Also including single-letter codes (R, W, G, etc.) as fallbacks
// in case the backend returns raw Pokewallet data that didn't get parsed
const energyIcons = {
  fire: fireIcon,
  water: waterIcon,
  grass: grassIcon,
  lightning: electricIcon,
  electric: electricIcon,
  psychic: psychicIcon,
  fighting: fightingIcon,
  darkness: darkIcon,
  dark: darkIcon,
  metal: steelIcon,
  steel: steelIcon,
  dragon: dragonIcon,
  colorless: colorlessIcon,
  fairy: psychicIcon,
  // Single-letter energy codes from Pokewallet's raw format
  r: fireIcon,
  w: waterIcon,
  g: grassIcon,
  l: electricIcon,
  p: psychicIcon,
  f: fightingIcon,
  d: darkIcon,
  m: steelIcon,
  y: psychicIcon,
  n: dragonIcon,
  c: colorlessIcon,
};

// Helper to look up the energy icon for a type string
// Handles edge cases where the type might have extra characters
// like "Wx2" from unparsed Pokewallet weakness data
const getEnergyIcon = (type) => {
  if (!type) return null;
  const key = type.toLowerCase();
  // Try exact match first
  if (energyIcons[key]) return energyIcons[key];
  // Try just the first character (handles raw codes like "Wx2")
  if (energyIcons[key.charAt(0)]) return energyIcons[key.charAt(0)];
  return null;
};

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
                {/* Extra details from Pokemon TCG API */}
                {card.mechanics?.evolvesFrom && (
                  <tr>
                    <td>Evolves From</td>
                    <td>{card.mechanics.evolvesFrom}</td>
                  </tr>
                )}
                {card.mechanics?.subtypes?.length > 0 && (
                  <tr>
                    <td>Subtypes</td>
                    <td>{card.mechanics.subtypes.join(', ')}</td>
                  </tr>
                )}
                {card.mechanics?.regulationMark && (
                  <tr>
                    <td>Regulation Mark</td>
                    <td>{card.mechanics.regulationMark}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Description - use flavor text from Pokemon TCG API if available,
              otherwise fall back to TCGdex description */}
          {(card.mechanics?.flavorText || card.description) && (
            <div className="card-description">
              <h3>Description</h3>
              <p>{card.mechanics?.flavorText || card.description}</p>
            </div>
          )}

          {/* ============================================
              CARD MECHANICS from Pokemon TCG API
              These sections only show up if the mechanics
              data was successfully fetched
              ============================================ */}

          {/* Abilities - things like "Ability: Blaze" that aren't attacks */}
          {card.mechanics?.abilities?.length > 0 && (
            <div className="mechanics-section">
              <h3>Abilities</h3>
              <div className="abilities-list">
                {card.mechanics.abilities.map((ability, index) => (
                  <div key={index} className="ability-item">
                    <div className="ability-header">
                      <span className="ability-type-badge">{ability.type}</span>
                      <span className="ability-name">{ability.name}</span>
                    </div>
                    {ability.text && <p className="ability-text">{ability.text}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Attacks - the moves this card can use in battle */}
          {card.mechanics?.attacks?.length > 0 && (
            <div className="mechanics-section">
              <h3>Attacks</h3>
              <div className="attacks-list">
                {card.mechanics.attacks.map((attack, index) => (
                  <div key={index} className="attack-item">
                    <div className="attack-header">
                      <div className="attack-cost">
                        {attack.cost.map((energy, i) => (
                          <span
                            key={i}
                            className="energy-badge"
                            title={energy}
                          >
                            {getEnergyIcon(energy) ? (
                              <img src={getEnergyIcon(energy)} alt={energy} />
                            ) : (
                              energy.charAt(0)
                            )}
                          </span>
                        ))}
                      </div>
                      <span className="attack-name">{attack.name}</span>
                      {attack.damage && (
                        <span className="attack-damage">{attack.damage}</span>
                      )}
                    </div>
                    {attack.text && <p className="attack-text">{attack.text}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Combat Info - weaknesses, resistances, and retreat cost */}
          {(card.mechanics?.weaknesses?.length > 0 ||
            card.mechanics?.resistances?.length > 0 ||
            card.mechanics?.retreatCost?.length > 0) && (
            <div className="mechanics-section">
              <h3>Combat Info</h3>
              <div className="combat-grid">
                {/* Weaknesses */}
                {card.mechanics.weaknesses?.length > 0 && (
                  <div className="combat-column">
                    <h4>Weakness</h4>
                    {card.mechanics.weaknesses.map((w, i) => (
                      <div key={i} className="combat-item">
                        <span
                          className="energy-badge"
                          title={w.type}
                        >
                          {getEnergyIcon(w.type) ? (
                            <img src={getEnergyIcon(w.type)} alt={w.type} />
                          ) : (
                            w.type.charAt(0)
                          )}
                        </span>
                        <span>{w.value}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Resistances */}
                {card.mechanics.resistances?.length > 0 && (
                  <div className="combat-column">
                    <h4>Resistance</h4>
                    {card.mechanics.resistances.map((r, i) => (
                      <div key={i} className="combat-item">
                        <span
                          className="energy-badge"
                          title={r.type}
                        >
                          {getEnergyIcon(r.type) ? (
                            <img src={getEnergyIcon(r.type)} alt={r.type} />
                          ) : (
                            r.type.charAt(0)
                          )}
                        </span>
                        <span>{r.value}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Retreat Cost */}
                {card.mechanics.retreatCost?.length > 0 && (
                  <div className="combat-column">
                    <h4>Retreat Cost</h4>
                    <div className="combat-item">
                      {card.mechanics.retreatCost.map((energy, i) => (
                        <span
                          key={i}
                          className="energy-badge"
                          title={energy}
                        >
                          {getEnergyIcon(energy) ? (
                            <img src={getEnergyIcon(energy)} alt={energy} />
                          ) : (
                            energy.charAt(0)
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Rules - common for ex, V, VMAX, VSTAR cards */}
          {card.mechanics?.rules?.length > 0 && (
            <div className="mechanics-section">
              <h3>Rules</h3>
              <ul className="rules-list">
                {card.mechanics.rules.map((rule, index) => (
                  <li key={index}>{rule}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Legalities - which formats this card is legal in */}
          {card.mechanics?.legalities && (
            <div className="mechanics-section">
              <h3>Format Legalities</h3>
              <div className="legality-badges">
                {Object.entries(card.mechanics.legalities).map(([format, status]) => (
                  <span
                    key={format}
                    className={`legality-badge legality-${status.toLowerCase()}`}
                  >
                    {format}: {status}
                  </span>
                ))}
              </div>
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
        {card.mechanics && (
          <>
            {' · Mechanics from '}
            <a href="https://pokewallet.io" target="_blank" rel="noopener noreferrer">
              Pokewallet
            </a>
          </>
        )}
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
