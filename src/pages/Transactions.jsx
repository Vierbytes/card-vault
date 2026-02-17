/**
 * Transactions Page
 *
 * Shows the user's completed transaction history split into two tabs:
 * Purchases (cards they bought) and Sales (cards they sold).
 *
 * I reused the same tab pattern from MyOffers since it works well
 * for this kind of two-list view. Each row links back to the
 * original offer so they can see the full conversation.
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { transactionAPI } from '../services/api';
import { GiCardPick } from 'react-icons/gi';
import { FiShoppingBag, FiDollarSign } from 'react-icons/fi';
import Loader from '../components/Loader';
import './Transactions.css';

function Transactions() {
  const [activeTab, setActiveTab] = useState('purchases');
  const [purchases, setPurchases] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all transactions on mount
  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      try {
        const response = await transactionAPI.getAll();
        setPurchases(response.data.data.purchases || []);
        setSales(response.data.data.sales || []);
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

              {/* Amount and date */}
              <div className="transaction-meta">
                <span className="transaction-amount">
                  ${transaction.amount?.toFixed(2)}
                </span>
                <span className="transaction-date">
                  {formatDate(transaction.completedAt)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default Transactions;
