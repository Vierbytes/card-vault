/**
 * Auth Context
 *
 * This provides authentication state to the entire app.
 * I learned that Context API is great for global state like user auth,
 * so we don't have to pass props through every component.
 */

import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

// Create the context
const AuthContext = createContext(null);

/**
 * Auth Provider Component
 *
 * This wraps the app and provides auth state to all children.
 */
export function AuthProvider({ children }) {
  // State for the current user
  const [user, setUser] = useState(null);

  // Loading state for initial auth check
  const [loading, setLoading] = useState(true);

  // Error state for auth operations
  const [error, setError] = useState(null);

  /**
   * Check if user is already logged in on app load
   *
   * This runs once when the app starts.
   * If there's a token in localStorage, we verify it's still valid.
   */
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');

      if (token && savedUser) {
        try {
          // Verify token is still valid by fetching user data
          const response = await authAPI.getMe();
          setUser(response.data.data);
        } catch (err) {
          // Token is invalid or expired - clear storage
          console.error('Token validation failed:', err);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }

      setLoading(false);
    };

    checkAuth();
  }, []);

  /**
   * Register a new user
   */
  const register = async (username, email, password) => {
    try {
      setError(null);
      const response = await authAPI.register({ username, email, password });

      // Store token and user in localStorage
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.data));

      // Update state
      setUser(response.data.data);

      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed';
      setError(message);
      return { success: false, error: message };
    }
  };

  /**
   * Log in an existing user
   */
  const login = async (email, password) => {
    try {
      setError(null);
      const response = await authAPI.login({ email, password });

      // Store token and user in localStorage
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.data));

      // Update state
      setUser(response.data.data);

      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed';
      setError(message);
      return { success: false, error: message };
    }
  };

  /**
   * Log out the current user
   */
  const logout = async () => {
    try {
      // Call logout endpoint (optional - mainly for server-side logging)
      await authAPI.logout();
    } catch (err) {
      // Even if the API call fails, we still want to clear local state
      console.error('Logout API error:', err);
    }

    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    // Clear state
    setUser(null);
  };

  /**
   * Update the user state (for profile updates)
   */
  const updateUser = (updatedData) => {
    const newUser = { ...user, ...updatedData };
    setUser(newUser);
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  /**
   * Social login - exchange an Auth0 access token for our app JWT
   * This gets called by the AuthCallback page after the redirect
   */
  const socialLogin = async (accessToken) => {
    try {
      setError(null);
      const response = await authAPI.socialLogin(accessToken);

      // Store token and user the same way as email/password login
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.data));

      setUser(response.data.data);

      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Social login failed';
      setError(message);
      return { success: false, error: message };
    }
  };

  /**
   * Clear any error messages
   */
  const clearError = () => {
    setError(null);
  };

  // The value object contains everything we want to share
  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    register,
    login,
    socialLogin,
    logout,
    updateUser,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Custom hook to use the auth context
 *
 * This makes it easy to access auth state in any component:
 * const { user, login, logout } = useAuth();
 */
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
