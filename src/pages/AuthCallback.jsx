/**
 * Auth Callback Page
 *
 * This page handles the redirect back from Auth0 after social login.
 * When a user clicks "Sign in with Google", Auth0 redirects them to Google,
 * then back to this /callback URL with an authorization code.
 *
 * The Auth0 SDK processes the code and state URL params automatically.
 * Once it's done, we grab the access token and send it to our backend.
 */

import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { getAccessTokenSilently, isAuthenticated: auth0Authenticated, isLoading, error: auth0Error } = useAuth0();
  const { socialLogin } = useAuth();
  const { showToast } = useToast();

  // Prevent running the callback logic twice (React strict mode)
  const hasRun = useRef(false);

  useEffect(() => {
    const handleCallback = async () => {
      if (hasRun.current) return;

      // Wait for Auth0 SDK to finish processing the callback URL params
      if (isLoading) return;

      // Check if we even have the expected callback params
      // If someone lands here without code/state, just redirect to login
      const hasCode = searchParams.has('code');
      if (!hasCode && !auth0Authenticated) {
        hasRun.current = true;
        navigate('/login', { replace: true });
        return;
      }

      // If Auth0 had an error processing the callback
      if (auth0Error) {
        hasRun.current = true;
        console.error('Auth0 callback error:', auth0Error);
        showToast('Sign in failed. Please try again.', 'error');
        navigate('/login', { replace: true });
        return;
      }

      // If Auth0 finished loading but user isn't authenticated
      if (!auth0Authenticated) {
        hasRun.current = true;
        showToast('Sign in failed. Please try again.', 'error');
        navigate('/login', { replace: true });
        return;
      }

      // Auth0 authenticated - exchange their token for our app JWT
      hasRun.current = true;

      try {
        const accessToken = await getAccessTokenSilently();

        // Send the Auth0 token to our backend
        const result = await socialLogin(accessToken);

        if (result.success) {
          showToast('Welcome!');
          navigate('/dashboard', { replace: true });
        } else {
          showToast('Login failed. Please try again.', 'error');
          navigate('/login', { replace: true });
        }
      } catch (err) {
        console.error('Token exchange error:', err);
        showToast('Something went wrong during sign in.', 'error');
        navigate('/login', { replace: true });
      }
    };

    handleCallback();
  }, [auth0Authenticated, isLoading, auth0Error]);

  return (
    <div className="loading-screen">
      <div className="loading-spinner"></div>
      <p>Completing sign in...</p>
    </div>
  );
}

export default AuthCallback;
