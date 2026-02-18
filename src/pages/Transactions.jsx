/**
 * Transactions Page
 *
 * Shows the user's completed transaction history split into two tabs:
 * Purchases (cards they bought) and Sales (cards they sold).
 *
 * I reused the same tab pattern from MyOffers since it works well
 * for this kind of two-list view. Each row links back to the
 * original offer so they can see the full conversation.
 *
 * Added review functionality - buyers can leave a star rating and
 * comment for each completed purchase. I check which transactions
 * already have reviews on load so the button shows "Reviewed" or
 * "Leave Review" appropriately.
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { transactionAPI, reviewAPI } from '../services/api';
import { GiCardPick } from 'react-icons/gi';
import { FiShoppingBag, FiDollarSign, FiStar } from 'react-icons/fi';
import Loader from '../components/Loader';
import ReviewForm from '../components/ReviewForm';
import './Transactions.css';

function Transactions() {
  const [activeTab, setActiveTab] = useState('purchases');
  const [purchases, setPurchases] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Review-related state
  const [reviewedTransactions, setReviewedTransactions] = useState(new Set());
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  // Fetch all transactions on mount
  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      try {
        const response = await transactionAPI.getAll();
        const purchaseList = response.data.data.purchases || [];
        const salesList = response.data.data.sales || [];

        setPurchases(purchaseList);
        setSales(salesList);

        // Check which purchases already have reviews
        // This way we know whether to show "Leave Review" or "Reviewed"
        if (purchaseList.length > 0) {
          const reviewChecks = await Promise.all(
            purchaseList.map((t) =>
              reviewAPI
                .getForTransaction(t._id)
                .catch(() => ({ data: { data: null } }))
            )
          );

          const reviewed = new Set();
          reviewChecks.forEach((res, index) => {
            if (res.data?.data) {
              reviewed.add(purchaseList[index]._id);
            }
          });
          setReviewedTransactions(reviewed);
        }
      } catch (err) {
        console.error('Error fetching transactions:', err);
        setError('Failed to load transactions.');
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  // The list to display based on active tab
  const currentList = activeTab === 'purchases' ? purchases : sales;

  // Format date nicely
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Handle opening the review modal
  const handleLeaveReview = (e, transaction) => {
    // Stop the click from bubbling up to the Link wrapper
    e.preventDefault();
    e.stopPropagation();
    setSelectedTransaction(transaction);
    setShowReviewModal(true);
  };

  // After a review is submitted, mark that transaction as reviewed
  const handleReviewSubmitted = () => {
    if (selectedTransaction) {
      setReviewedTransactions(
        (prev) => new Set([...prev, selectedTransaction._id])
      );
    }
  };

  return (
    <div className="transactions-page">
      {/* Header */}
      <div className="transactions-header">
        <h1>Transaction History</h1>
        <p>Your completed purchases and sales</p>
      </div>

      {/* Tabs */}
      <div className="transaction-tabs">
        <button
          className={`tab ${activeTab === 'purchases' ? 'active' : ''}`}
          onClick={() => setActiveTab('purchases')}
        >
          Purchases ({purchases.length})
        </button>
        <button
          className={`tab ${activeTab === 'sales' ? 'active' : ''}`}
          onClick={() => setActiveTab('sales')}
        >
          Sales ({sales.length})
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <Loader message="Loading transactions..." />
      ) : error ? (
        <div className="transactions-empty">
          <p>{error}</p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>
            Try Again
          </button>
        </div>
      ) : currentList.length === 0 ? (
        <div className="transactions-empty">
          {activeTab === 'purchases' ? (
            <>
              <FiShoppingBag className="empty-icon" />
              <h3>No purchases yet</h3>
              <p>When you buy cards from the marketplace, they'll appear here.</p>
              <Link to="/marketplace" className="btn btn-primary">
                Browse Marketplace
              </Link>
            </>
          ) : (
            <>
              <FiDollarSign className="empty-icon" />
              <h3>No sales yet</h3>
              <p>When someone buys your listed cards, they'll appear here.</p>
              <Link to="/listings/create" className="btn btn-primary">
                Create a Listing
              </Link>
            </>
          )}
        </div>
      ) : (
        <div className="transactions-list">
          {currentList.map((transaction) => (
            <Link
              to={`/offers/${transaction.tradeOffer?._id}`}
              key={transaction._id}
              className="transaction-row"
            >
              {/* Card thumbnail */}
              <div className="transaction-thumb">
                {transaction.card?.imageUrl ? (
                  <img src={transaction.card.imageUrl} alt={transaction.card?.name} />
                ) : (
                  <GiCardPick className="thumb-placeholder" />
                )}
              </div>

              {/* Card info */}
              <div className="transaction-info">
                <h3>{transaction.card?.name || 'Unknown Card'}</h3>
                <p className="transaction-set">
                  {transaction.card?.setName} · {transaction.card?.game}
                </p>
              </div>

              {/* Other party */}
              <div className="transaction-party">
                <span className="party-label">
                  {activeTab === 'purchases' ? 'Seller' : 'Buyer'}
                </span>
                <span className="party-username">
                  {activeTab === 'purchases'
                    ? transaction.seller?.username
                    : transaction.buyer?.username}
                </span>
              </div>

              {/* Amount, date, and review button */}
              <div className="transaction-meta">
                <span className="transaction-amount">
                  ${transaction.amount?.toFixed(2)}
                </span>
                <span className="transaction-date">
                  {formatDate(transaction.completedAt)}
                </span>

                {/* Show review button only for purchases */}
                {activeTab === 'purchases' && (
                  <>
                    {reviewedTransactions.has(transaction._id) ? (
                      <span className="review-badge">
                        <FiStar className="review-badge-icon" /> Reviewed
                      </span>
                    ) : (
                      <button
                        className="btn-review"
                        onClick={(e) => handleLeaveReview(e, transaction)}
                      >
                        <FiStar /> Leave Review
                      </button>
                    )}
                  </>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Review modal */}
      {showReviewModal && selectedTransaction && (
        <ReviewForm
          transaction={selectedTransaction}
          onClose={() => {
            setShowReviewModal(false);
            setSelectedTransaction(null);
          }}
          onReviewSubmitted={handleReviewSubmitted}
        />
      )}
    </div>
  );
}

export default Transactions;
