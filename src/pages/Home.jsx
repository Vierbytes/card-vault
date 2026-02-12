/**
 * Home Page
 *
 * The landing page for CardVault.
 * Shows the hero section, feature highlights, and some trending cards.
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { cardAPI, listingAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FiCamera, FiDollarSign, FiRepeat } from 'react-icons/fi';
import { GiCardPick } from 'react-icons/gi';
import CardGrid from '../components/CardGrid';
import './Home.css';

function Home() {
  const { user } = useAuth();
  const [trendingCards, setTrendingCards] = useState([]);
  const [recentListings, setRecentListings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch some data for the home page
  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        // Fetch random Pokemon cards from TCGdex for the trending section
        // I'm using TCGdex here because it guarantees card images will load
        const [cardsRes, listingsRes] = await Promise.all([
          cardAPI.random(8),
          listingAPI.getAll({ limit: 4 }),
        ]);

        setTrendingCards(cardsRes.data.data || []);
        setRecentListings(listingsRes.data.data || []);
      } catch (error) {
        console.error('Error fetching home data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">
            Know Your Cards.
            <br />
            <span className="highlight">Find Your Buyers.</span>
          </h1>
          <p className="hero-subtitle">
            The ultimate marketplace for trading card game collectors. Scan your cards, check
            prices, and connect with buyers instantly.
          </p>
          <div className="hero-actions">
            <Link to="/scanner" className="btn btn-primary btn-lg">
              Scan a Card
            </Link>
            <Link to="/marketplace" className="btn btn-secondary btn-lg">
              Browse Marketplace
            </Link>
          </div>
        </div>

        {/* Feature cards */}
        <div className="hero-features">
          <div className="feature-card">
            <FiCamera className="feature-icon" />
            <h3>Scan</h3>
            <p>Upload a card image and we'll identify it instantly</p>
          </div>
          <div className="feature-card">
            <FiDollarSign className="feature-icon" />
            <h3>Price</h3>
            <p>Get real-time market prices and historical trends</p>
          </div>
          <div className="feature-card">
            <FiRepeat className="feature-icon" />
            <h3>Sell</h3>
            <p>List your cards and match with interested buyers</p>
          </div>
        </div>
      </section>

      {/* Trending Cards Section */}
      <section className="section">
        <div className="section-header">
          <h2 className="section-title">Trending Cards</h2>
          <Link to="/cards" className="section-link">
            View All →
          </Link>
        </div>
        <CardGrid cards={trendingCards} loading={loading} showPrice={true} />
      </section>

      {/* Recent Listings Section */}
      <section className="section">
        <div className="section-header">
          <h2 className="section-title">Recent Listings</h2>
          <Link to="/marketplace" className="section-link">
            View Marketplace →
          </Link>
        </div>
        {recentListings.length > 0 ? (
          <div className="listings-preview">
            {recentListings.map((listing) => (
              <Link
                key={listing._id}
                to={`/listings/${listing._id}`}
                className="listing-preview-item"
              >
                <div className="listing-image">
                  {listing.card?.imageUrl ? (
                    <img src={listing.card.imageUrl} alt={listing.card.name} />
                  ) : (
                    <GiCardPick className="placeholder" />
                  )}
                </div>
                <div className="listing-info">
                  <h4>{listing.card?.name}</h4>
                  <p className="listing-price">${listing.price?.toFixed(2)}</p>
                  <p className="listing-seller">by {listing.seller?.username}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="no-listings">No listings yet. Be the first to list a card!</p>
        )}
      </section>

      {/* CTA Section - only show for guests */}
      {!user && (
        <section className="cta-section">
          <h2>Ready to start trading?</h2>
          <p>Join thousands of collectors buying and selling cards on CardVault.</p>
          <Link to="/register" className="btn btn-primary btn-lg">
            Create Free Account
          </Link>
        </section>
      )}
    </div>
  );
}

export default Home;
