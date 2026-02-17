/**
 * Navbar Component
 *
 * The main navigation bar for the app.
 * Shows different links based on whether user is logged in.
 */

import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { GiCardPick } from 'react-icons/gi';
import { FaBell } from 'react-icons/fa';
import './Navbar.css';

function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const {
    unreadCount,
    notifications,
    loading: notificationsLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotifications();
  const navigate = useNavigate();

  // State for mobile menu toggle
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // State for notification dropdown
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const notificationRef = useRef(null);

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

  // Toggle notification dropdown - fetch notifications when opening
  const toggleNotifications = async () => {
    if (!isNotificationOpen) {
      await fetchNotifications();
    }
    setIsNotificationOpen(!isNotificationOpen);
  };

  // Click a notification - mark as read and navigate to the offer
  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification._id);
    }
    setIsNotificationOpen(false);
    navigate(`/offers/${notification.relatedOffer}`);
  };

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsNotificationOpen(false);
      }
    };

    if (isNotificationOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isNotificationOpen]);

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

                {/* Notification Bell */}
                <div className="notification-bell-container" ref={notificationRef}>
                  <button
                    className="notification-bell"
                    onClick={toggleNotifications}
                    aria-label="Notifications"
                  >
                    <FaBell />
                    {unreadCount > 0 && (
                      <span className="notification-badge">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notification Dropdown */}
                  {isNotificationOpen && (
                    <div className="notification-dropdown">
                      <div className="notification-dropdown-header">
                        <h3>Notifications</h3>
                        {unreadCount > 0 && (
                          <button
                            className="mark-all-read-btn"
                            onClick={markAllAsRead}
                          >
                            Mark all as read
                          </button>
                        )}
                      </div>

                      <div className="notification-list">
                        {notificationsLoading ? (
                          <div className="notification-empty">Loading...</div>
                        ) : notifications.length === 0 ? (
                          <div className="notification-empty">
                            No notifications yet
                          </div>
                        ) : (
                          notifications.map((notification) => (
                            <div
                              key={notification._id}
                              className={`notification-item ${
                                notification.read ? 'read' : 'unread'
                              }`}
                              onClick={() => handleNotificationClick(notification)}
                            >
                              <p className="notification-message">
                                {notification.message}
                              </p>
                              <span className="notification-time">
                                {new Date(notification.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

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
                    <Link to="/offers" className="dropdown-link" onClick={closeMenu}>
                      Offers
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
