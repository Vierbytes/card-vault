/**
 * Login Page
 *
 * Handles user authentication with email and password.
 */

import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, error, clearError } = useAuth();

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
            🃏 CardVault
          </Link>
          <h1>Welcome back</h1>
          <p>Sign in to your account to continue</p>
        </div>

        {/* Error message */}
        {(formError || error) && (
          <div className="auth-error">
            <span className="error-icon">⚠️</span>
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
