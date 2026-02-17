/**
 * Payment Success Page
 *
 * Shows after Stripe redirects the user back from a successful payment.
 * Displays a checkmark and success message, then auto-redirects to
 * the transaction history page after a few seconds.
 *
 * I added a manual button too in case the auto-redirect feels too fast
 * or the user wants to go somewhere else first.
 */

import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiCheckCircle } from 'react-icons/fi';
import './PaymentSuccess.css';

function PaymentSuccess() {
  const navigate = useNavigate();

  // Auto-redirect to transactions after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/transactions');
    }, 3000);

    // Clean up if user navigates away before the timer fires
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="payment-success-page">
      <div className="success-card">
        <FiCheckCircle className="success-icon" />
        <h1>Payment Successful!</h1>
        <p>Your payment has been processed. The seller will be notified.</p>
        <p className="redirect-notice">Redirecting to transaction history...</p>
        <Link to="/transactions" className="btn btn-primary">
          View Transactions
        </Link>
      </div>
    </div>
  );
}

export default PaymentSuccess;
