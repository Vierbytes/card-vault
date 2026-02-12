/**
 * App Component
 *
 * The main app component that sets up routing and global providers.
 * I'm using React Router for client-side navigation and Context API for auth state.
 *
 * I organized routes into public (anyone can see) and protected (login required).
 * Each page component is in its own file under src/pages/.
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Auth0Provider } from '@auth0/auth0-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

// Layout components
import Navbar from './components/Navbar';

// Page components - importing all the pages I built
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Marketplace from './pages/Marketplace';
import CardDetails from './pages/CardDetails';
import BrowseCards from './pages/BrowseCards';
import Collection from './pages/Collection';
import Wishlist from './pages/Wishlist';
import CreateListing from './pages/CreateListing';
import MyListings from './pages/MyListings';
import ListingDetails from './pages/ListingDetails';
import Profile from './pages/Profile';
import Matches from './pages/Matches';
import Scanner from './pages/Scanner';
import AuthCallback from './pages/AuthCallback';
// Styles
import './App.css';

/**
 * Protected Route Component
 *
 * This wrapper component checks if user is authenticated.
 * If not, it redirects to the login page.
 */
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

/**
 * App Layout Component
 *
 * Wraps pages with the navbar and main content area.
 */
function AppLayout({ children }) {
  return (
    <div className="app-layout">
      <Navbar />
      <main className="main-content">{children}</main>
    </div>
  );
}

/**
 * Main App Component
 */
function App() {
  return (
    <Router>
      <Auth0Provider
        domain={import.meta.env.VITE_AUTH0_DOMAIN}
        clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
        authorizationParams={{
          redirect_uri: window.location.origin + '/callback',
          audience: import.meta.env.VITE_AUTH0_AUDIENCE,
        }}
      >
      <AuthProvider>
        <ToastProvider>
        <AppLayout>
          <Routes>
            {/* Public routes - anyone can access these */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/callback" element={<AuthCallback />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/cards" element={<BrowseCards />} />
            <Route path="/cards/:id" element={<CardDetails />} />
            <Route path="/scanner" element={<Scanner />} />
            <Route path="/listings/:id" element={<ListingDetails />} />

            {/* Protected routes - require authentication */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/collection"
              element={
                <ProtectedRoute>
                  <Collection />
                </ProtectedRoute>
              }
            />
            <Route
              path="/wishlist"
              element={
                <ProtectedRoute>
                  <Wishlist />
                </ProtectedRoute>
              }
            />
            <Route
              path="/listings/mine"
              element={
                <ProtectedRoute>
                  <MyListings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/listings/create"
              element={
                <ProtectedRoute>
                  <CreateListing />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/matches"
              element={
                <ProtectedRoute>
                  <Matches />
                </ProtectedRoute>
              }
            />

            {/* 404 fallback */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
        </ToastProvider>
      </AuthProvider>
      </Auth0Provider>
    </Router>
  );
}

/**
 * 404 Not Found Page
 */
function NotFound() {
  return (
    <div className="not-found-page">
      <h1>404</h1>
      <p>Page not found</p>
      <a href="/" className="btn btn-primary">
        Go Home
      </a>
    </div>
  );
}

export default App;
