/**
 * API Service
 *
 * This handles all HTTP requests to our backend API.
 * I'm using axios because it makes handling requests and responses easier.
 * It also lets me set up interceptors for adding auth tokens automatically.
 */

import axios from 'axios';

// Create an axios instance with default config
// This base URL points to our backend server
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request Interceptor
 *
 * This runs before every request is sent.
 * I'm using it to automatically add the JWT token to requests.
 */
api.interceptors.request.use(
  (config) => {
    // Get the token from localStorage
    const token = localStorage.getItem('token');

    // If token exists, add it to the Authorization header
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor
 *
 * This runs after every response is received.
 * Useful for handling common errors like expired tokens.
 */
api.interceptors.response.use(
  (response) => {
    // Just return the response data for successful requests
    return response;
  },
  (error) => {
    // Handle specific error cases
    if (error.response) {
      // Token expired or invalid
      if (error.response.status === 401) {
        // Clear stored token and user data
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        // Redirect to login if not already there
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

// ============================================
// AUTH API CALLS
// ============================================

export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
};

// ============================================
// USER API CALLS
// ============================================

export const userAPI = {
  getProfile: (userId) => api.get(`/users/${userId}`),
  updateProfile: (userData) => api.put('/users/me', userData),
  updatePassword: (passwords) => api.put('/users/me/password', passwords),
  getUserListings: (userId) => api.get(`/users/${userId}/listings`),
};

// ============================================
// CARD API CALLS
// Everything goes through TCGdex now - Pokemon cards with images and pricing
// ============================================

export const cardAPI = {
  // Search Pokemon cards by name
  search: (params) => api.get('/cards/search', { params }),

  // Get full card details by TCGdex ID (e.g., 'swsh3-136')
  getById: (cardId) => api.get(`/cards/${cardId}`),

  // Get price history for Chart.js graphs
  getPriceHistory: (cardId, duration) =>
    api.get(`/cards/${cardId}/price-history`, { params: { duration } }),

  // Get random cards for featured/trending sections
  random: (count) => api.get('/cards/random', { params: { count } }),
};

// ============================================
// LISTING API CALLS
// ============================================

export const listingAPI = {
  getAll: (params) => api.get('/listings', { params }),
  getById: (listingId) => api.get(`/listings/${listingId}`),
  getMine: (status) => api.get('/listings/mine', { params: { status } }),
  create: (listingData) => api.post('/listings', listingData),
  update: (listingId, listingData) => api.put(`/listings/${listingId}`, listingData),
  delete: (listingId) => api.delete(`/listings/${listingId}`),
};

// ============================================
// COLLECTION API CALLS
// ============================================

export const collectionAPI = {
  getAll: (params) => api.get('/collections', { params }),
  add: (itemData) => api.post('/collections', itemData),
  update: (itemId, itemData) => api.put(`/collections/${itemId}`, itemData),
  remove: (itemId) => api.delete(`/collections/${itemId}`),
};

// ============================================
// WISHLIST API CALLS
// ============================================

export const wishlistAPI = {
  getAll: (params) => api.get('/wishlists', { params }),
  add: (itemData) => api.post('/wishlists', itemData),
  update: (itemId, itemData) => api.put(`/wishlists/${itemId}`, itemData),
  remove: (itemId) => api.delete(`/wishlists/${itemId}`),
};

// ============================================
// MATCHES API CALLS
// ============================================

export const matchAPI = {
  getMatches: () => api.get('/matches'),
};

export default api;
