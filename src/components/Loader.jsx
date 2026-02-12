/**
 * Loader Component
 *
 * A Pokeball loading animation that wobbles back and forth.
 * Used across the app wherever we need to show a loading state
 * instead of the old skeleton placeholders.
 *
 * Usage:
 *   <Loader />
 *   <Loader message="Searching cards..." />
 */

import './Loader.css';

function Loader({ message = 'Loading...' }) {
  return (
    <div className="loader-container">
      <div className="loader-ball" />
      <p className="loader-text">{message}</p>
    </div>
  );
}

export default Loader;
