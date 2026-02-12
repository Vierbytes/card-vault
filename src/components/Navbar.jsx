/**
 * Navbar Component
 *
 * The main navigation bar for the app.
 * Shows different links based on whether user is logged in.
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GiCardPick } from 'react-icons/gi';
import './Navbar.css';

function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  // State for mobile menu toggle
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Handle logout
  const handleLogout = async () => {
    await logout();
    navigate('/');
    setIsMenuOpen(false);
  };

  // Toggle mobile menu
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Close menu when a link is clicked
  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo */}
        <Link to="/" className="navbar-logo" onClick={closeMenu}>
          <GiCardPick className="logo-icon" />
          <span className="logo-text">CardVault</span>
        </Link>

        {/* Hamburger menu button for mobile */}
        <button
          className={`hamburger ${isMenuOpen ? 'active' : ''}`}
          onClick={toggleMenu}
          aria-label="Toggle navigation menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        {/* Navigation links */}
        <div className={`navbar-menu ${isMenuOpen ? 'active' : ''}`}>
          {/* Main navigation links */}
          <div className="navbar-links">
            <Link to="/marketplace" className="nav-link" onClick={closeMenu}>
              Marketplace
            </Link>
            <Link to="/scanner" className="nav-link" onClick={closeMenu}>
              Card Scanner
            </Link>
            <Link to="/cards" className="nav-link" onClick={closeMenu}>
              Browse Cards
            </Link>
          </div>

          {/* Auth section */}
          <div className="navbar-auth">
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="nav-link" onClick={closeMenu}>
                  Dashboard
                </Link>
                <div className="user-menu">
                  <button className="user-button">
                    <span className="user-avatar">
                      {user?.avatar ? (
                        <img src={user.avatar} alt={user.username} />
                      ) : (
                        user?.username?.charAt(0).toUpperCase()
                      )}
                    </span>
                    <span className="user-name">{user?.username}</span>
                  </button>
                  <div className="user-dropdown">
                    <Link to="/profile" className="dropdown-link" onClick={closeMenu}>
                      Profile
                    </Link>
                    <Link to="/collection" className="dropdown-link" onClick={closeMenu}>
                      My Collection
                    </Link>
                    <Link to="/wishlist" className="dropdown-link" onClick={closeMenu}>
                      Wishlist
                    </Link>
                    <Link to="/listings/mine" className="dropdown-link" onClick={closeMenu}>
                      My Listings
                    </Link>
                    <hr className="dropdown-divider" />
                    <button className="dropdown-link logout-btn" onClick={handleLogout}>
                      Logout
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="nav-link" onClick={closeMenu}>
                  Login
                </Link>
                <Link to="/register" className="nav-link btn-primary" onClick={closeMenu}>
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
