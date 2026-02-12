/**
 * Login Page
 *
 * Handles user authentication with email and password.
 */

import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { GiCardPick } from 'react-icons/gi';
import { FiAlertTriangle } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import './Auth.css';

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, error, clearError } = useAuth();
  const { showToast } = useToast();
  const { loginWithRedirect } = useAuth0();

  // Social login - redirects to Auth0 hosted login page for the chosen provider
  const handleSocialLogin = (connection) => {
    loginWithRedirect({
      authorizationParams: {
        connection,
      },
    });
  };

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Get the redirect path from location state (if user was redirected here)
  const from = location.state?.from?.pathname || '/dashboard';

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear errors when user starts typing
    if (formError) setFormError('');
    if (error) clearError();
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    // Basic validation
    if (!formData.email || !formData.password) {
      setFormError('Please fill in all fields');
      return;
    }

    setLoading(true);

    const result = await login(formData.email, formData.password);

    if (result.success) {
      showToast('Welcome back!');
      // Redirect to the page they were trying to access, or dashboard
      navigate(from, { replace: true });
    } else {
      setFormError(result.error);
    }

    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        {/* Header */}
        <div className="auth-header">
          <Link to="/" className="auth-logo">
            <GiCardPick style={{ verticalAlign: 'middle', marginRight: '0.25rem' }} /> CardVault
          </Link>
          <h1>Welcome back</h1>
          <p>Sign in to your account to continue</p>
        </div>

        {/* Error message */}
        {(formError || error) && (
          <div className="auth-error">
            <FiAlertTriangle className="error-icon" />
            {formError || error}
          </div>
        )}

        {/* Login form */}
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Divider between form and social login */}
        <div className="auth-divider">
          <span>or continue with</span>
        </div>

        {/* Social login buttons */}
        <div className="social-buttons">
          <button
            type="button"
            className="btn btn-social btn-google"
            onClick={() => handleSocialLogin('google-oauth2')}
          >
            <FcGoogle /> Google
          </button>
        </div>

        {/* Footer */}
        <div className="auth-footer">
          <p>
            Don't have an account?{' '}
            <Link to="/register" className="auth-link">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
