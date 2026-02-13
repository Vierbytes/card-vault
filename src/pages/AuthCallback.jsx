/**
 * Auth Callback Page
 *
 * This page handles the redirect back from Auth0 after social login.
 * When a user clicks "Sign in with Google", Auth0 redirects them to Google,
 * then back to this /callback URL with an authorization code.
 *
 * I had a tricky bug where the old version relied on isAuthenticated
 * changing reactively, but it would sometimes be false even after
 * loading finished because the SDK hadn't finished the code exchange yet.
 * Now I call handleRedirectCallback explicitly to process the code param,
 * which is way more reliable.
 */

import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { handleRedirectCallback, getAccessTokenSilently } = useAuth0();
  const { socialLogin } = useAuth();
  const { showToast } = useToast();

  // Prevent running the callback logic twice (React strict mode)
  const hasRun = useRef(false);

  useEffect(() => {
    const processCallback = async () => {
      if (hasRun.current) return;
      hasRun.current = true;

      // Check if we even have the expected callback params
      // If someone lands here without code/state, just redirect to login
      const hasCode = searchParams.has('code');
      const hasState = searchParams.has('state');

      if (!hasCode || !hasState) {
        navigate('/login', { replace: true });
        return;
      }

      try {
        // Explicitly tell the Auth0 SDK to process the code + state params
        // This exchanges the authorization code for tokens
        await handleRedirectCallback();

        // Now get the access token to send to our backend
        const accessToken = await getAccessTokenSilently();

        // Send the Auth0 token to our backend for our own JWT
        const result = await socialLogin(accessToken);

        if (result.success) {
          showToast('Welcome!');
          navigate('/dashboard', { replace: true });
        } else {
          showToast('Login failed. Please try again.', 'error');
          navigate('/login', { replace: true });
        }
      } catch (err) {
        console.error('Auth callback error:', err);
        showToast('Sign in failed. Please try again.', 'error');
        navigate('/login', { replace: true });
      }
    };

    processCallback();
  }, []);

  return (
    <div className="loading-screen">
      <div className="loading-spinner"></div>
      <p>Completing sign in...</p>
    </div>
  );
}

export default AuthCallback;
