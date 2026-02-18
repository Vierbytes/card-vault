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
  // Exchange Auth0 access token for our app JWT
  socialLogin: (accessToken) => api.post('/auth/social', { accessToken }),
};

// ============================================
// USER API CALLS
// ============================================

export const userAPI = {
  getProfile: (userId) => api.get(`/users/${userId}`),
  updateProfile: (userData) => api.put('/users/me', userData),
  updatePassword: (passwords) => api.put('/users/me/password', passwords),
  getUserListings: (userId) => api.get(`/users/${userId}/listings`),
  getUserTradeStats: (userId) => api.get(`/users/${userId}/trade-stats`),

  // Avatar upload needs FormData instead of JSON
  // I had to override the Content-Type header so the browser sets
  // the correct multipart boundary automatically
  uploadAvatar: (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return api.put('/users/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
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

  // Scan a card image - sends the photo to the backend for OCR
  // Uses FormData since we're uploading a file, not JSON
  scan: (file) => {
    const formData = new FormData();
    formData.append('cardImage', file);
    return api.post('/cards/scan', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// ============================================
// LISTING API CALLS
// ============================================

export const listingAPI = {
  getAll: (params) => api.get('/listings', { params }),
  getById: (listingId) => api.get(`/listings/${listingId}`),
  getFilters: () => api.get('/listings/filters'),
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

// ============================================
// TRADE OFFER API CALLS
// ============================================

export const tradeOfferAPI = {
  // Create a new offer on a listing
  create: (offerData) => api.post('/trade-offers', offerData),

  // Get offers I've sent as a buyer
  getSent: (status) => api.get('/trade-offers/sent', { params: { status } }),

  // Get offers I've received as a seller
  getReceived: (status) => api.get('/trade-offers/received', { params: { status } }),

  // Get a single offer by ID
  getById: (offerId) => api.get(`/trade-offers/${offerId}`),

  // Accept an offer (seller action)
  accept: (offerId, responseMessage) =>
    api.put(`/trade-offers/${offerId}/accept`, { responseMessage }),

  // Decline an offer (seller action)
  decline: (offerId, responseMessage) =>
    api.put(`/trade-offers/${offerId}/decline`, { responseMessage }),

  // Cancel an offer (buyer action)
  cancel: (offerId) => api.put(`/trade-offers/${offerId}/cancel`),

  // Get all offers for a specific listing (seller)
  getForListing: (listingId) => api.get(`/trade-offers/listing/${listingId}`),
};

// ============================================
// MESSAGE API CALLS
// ============================================

export const messageAPI = {
  // Get all messages for a trade offer thread
  getForOffer: (offerId) => api.get(`/messages/offer/${offerId}`),

  // Send a message in a trade offer thread
  send: (messageData) => api.post('/messages', messageData),

  // Mark messages as read
  markRead: (offerId) => api.put(`/messages/offer/${offerId}/read`),
};

// ============================================
// NOTIFICATION API CALLS
// ============================================

export const notificationAPI = {
  // Get my notifications (newest first, with optional limit)
  getAll: (params) => api.get('/notifications', { params }),

  // Get count of unread notifications (for the bell badge)
  getUnreadCount: () => api.get('/notifications/unread-count'),

  // Mark a single notification as read
  markAsRead: (notificationId) => api.put(`/notifications/${notificationId}/read`),

  // Mark all notifications as read
  markAllAsRead: () => api.put('/notifications/mark-all-read'),
};

// ============================================
// PAYMENT API CALLS
// ============================================

export const paymentAPI = {
  // Create a Stripe Checkout Session for an accepted offer
  createCheckoutSession: (offerId) =>
    api.post('/payments/create-checkout-session', { offerId }),
};

// ============================================
// TRANSACTION API CALLS
// ============================================

export const transactionAPI = {
  // Get my purchase and sale history
  getAll: () => api.get('/transactions'),
};

// ============================================
// REVIEW API CALLS
// ============================================

export const reviewAPI = {
  // Submit a review for a completed transaction
  create: (reviewData) => api.post('/reviews', reviewData),

  // Get all reviews for a seller (public - used on profile pages)
  getSellerReviews: (sellerId) => api.get(`/reviews/seller/${sellerId}`),

  // Check if a specific transaction has been reviewed
  getForTransaction: (transactionId) =>
    api.get(`/reviews/transaction/${transactionId}`),
};

export default api;
