/**
 * Offer Details Page
 *
 * Shows a single trade offer with full details and a message thread.
 * The seller can accept/decline, the buyer can cancel.
 * Both can send messages to negotiate.
 *
 * This was probably the most complex page I've built so far -
 * it has to handle different views depending on whether you're
 * the buyer or seller, and the offer status changes what actions
 * are available.
 */

import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { tradeOfferAPI, messageAPI } from '../services/api';
import { GiCardPick } from 'react-icons/gi';
import Loader from '../components/Loader';
import './OfferDetails.css';

function OfferDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();

  // Offer data
  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Messages
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  // Accept/decline modal state
  const [showResponseForm, setShowResponseForm] = useState(null); // 'accept' or 'decline'
  const [responseMessage, setResponseMessage] = useState('');
  const [responding, setResponding] = useState(false);

  // Ref for scrolling messages to bottom
  const messagesEndRef = useRef(null);

  // Figure out if the current user is the buyer or seller
  const isBuyer = user && offer?.buyer?._id === user._id;
  const isSeller = user && offer?.seller?._id === user._id;

  // Fetch offer details
  useEffect(() => {
    const fetchOffer = async () => {
      setLoading(true);
      try {
        const response = await tradeOfferAPI.getById(id);
        setOffer(response.data.data);
      } catch (err) {
        console.error('Error fetching offer:', err);
        setError('Offer not found or you don\'t have access.');
      } finally {
        setLoading(false);
      }
    };

    fetchOffer();
  }, [id]);

  // Fetch messages when offer loads
  useEffect(() => {
    if (!offer) return;

    const fetchMessages = async () => {
      try {
        const response = await messageAPI.getForOffer(id);
        setMessages(response.data.data || []);
        // Mark messages as read when we view them
        await messageAPI.markRead(id);
      } catch (err) {
        console.error('Error fetching messages:', err);
      }
    };

    fetchMessages();
  }, [offer, id]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle sending a message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setSendingMessage(true);
    try {
      const response = await messageAPI.send({
        offerId: id,
        content: newMessage.trim(),
      });
      // Add the new message to the list right away
      setMessages((prev) => [...prev, response.data.data]);
      setNewMessage('');
    } catch (err) {
      showToast('Failed to send message', 'error');
    }
    setSendingMessage(false);
  };

  // Handle accept/decline
  const handleRespond = async (action) => {
    setResponding(true);
    try {
      if (action === 'accept') {
        const response = await tradeOfferAPI.accept(id, responseMessage);
        setOffer(response.data.data);
        showToast('Offer accepted!');
      } else {
        const response = await tradeOfferAPI.decline(id, responseMessage);
        setOffer(response.data.data);
        showToast('Offer declined');
      }
      setShowResponseForm(null);
      setResponseMessage('');
    } catch (err) {
      showToast(`Failed to ${action} offer`, 'error');
    }
    setResponding(false);
  };

  // Handle cancel (buyer)
  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this offer?')) return;

    try {
      const response = await tradeOfferAPI.cancel(id);
      setOffer(response.data.data);
      showToast('Offer cancelled');
    } catch (err) {
      showToast('Failed to cancel offer', 'error');
    }
  };

  // Status badge styling
  const getStatusBadge = (status) => {
    const styles = {
      pending: 'badge-pending',
      accepted: 'badge-accepted',
      declined: 'badge-declined',
      cancelled: 'badge-cancelled',
    };
    return styles[status] || '';
  };

  // Format timestamp for messages
  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (loading) return <Loader message="Loading offer..." />;

  if (error || !offer) {
    return (
      <div className="offer-details-page">
        <div className="offer-error">
          <h2>Offer Not Found</h2>
          <p>{error || 'This offer may have been removed.'}</p>
          <Link to="/offers" className="btn btn-primary">
            Back to Offers
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="offer-details-page">
      {/* Back link */}
      <Link to="/offers" className="back-link">&larr; Back to Offers</Link>

      {/* Offer summary card */}
      <div className="offer-summary">
        <div className="offer-summary-top">
          {/* Card image */}
          <div className="offer-card-image">
            {offer.card?.imageUrl ? (
              <img src={offer.card.imageUrl} alt={offer.card?.name} />
            ) : (
              <GiCardPick className="image-placeholder" />
            )}
          </div>

          {/* Offer info */}
          <div className="offer-summary-info">
            <h1>{offer.card?.name || 'Unknown Card'}</h1>
            <p className="offer-card-set">
              {offer.card?.setName} · {offer.card?.game}
            </p>

            <div className="offer-price-comparison">
              <div className="price-block">
                <span className="price-label">Offered</span>
                <span className="price-value offered">${offer.offeredPrice?.toFixed(2)}</span>
              </div>
              <div className="price-block">
                <span className="price-label">Listing Price</span>
                <span className="price-value">${offer.listingPrice?.toFixed(2)}</span>
              </div>
            </div>

            <span className={`status-badge ${getStatusBadge(offer.status)}`}>
              {offer.status}
            </span>
          </div>
        </div>

        {/* Buyer and seller info */}
        <div className="offer-parties">
          <div className="party">
            <span className="party-role">Buyer</span>
            <div className="party-user">
              <span className="party-avatar">
                {offer.buyer?.username?.charAt(0).toUpperCase()}
              </span>
              <span className="party-name">
                {offer.buyer?.username}
                {isBuyer && ' (You)'}
              </span>
            </div>
          </div>
          <div className="party">
            <span className="party-role">Seller</span>
            <div className="party-user">
              <span className="party-avatar">
                {offer.seller?.username?.charAt(0).toUpperCase()}
              </span>
              <span className="party-name">
                {offer.seller?.username}
                {isSeller && ' (You)'}
              </span>
            </div>
          </div>
        </div>

        {/* Initial message if there was one */}
        {offer.initialMessage && (
          <div className="offer-initial-message">
            <span className="message-label">Buyer's note:</span>
            <p>{offer.initialMessage}</p>
          </div>
        )}

        {/* Seller's response message if offer was resolved */}
        {offer.responseMessage && (
          <div className="offer-response-message">
            <span className="message-label">Seller's response:</span>
            <p>{offer.responseMessage}</p>
          </div>
        )}
      </div>

      {/* Actions section - depends on role and status */}
      {offer.status === 'pending' && (
        <div className="offer-actions">
          {isSeller && !showResponseForm && (
            <>
              <button
                className="btn btn-primary"
                onClick={() => setShowResponseForm('accept')}
              >
                Accept Offer
              </button>
              <button
                className="btn btn-danger"
                onClick={() => setShowResponseForm('decline')}
              >
                Decline
              </button>
            </>
          )}

          {isBuyer && (
            <button className="btn btn-secondary" onClick={handleCancel}>
              Cancel Offer
            </button>
          )}

          {/* Response form (accept/decline with optional message) */}
          {showResponseForm && (
            <div className="response-form">
              <h3>
                {showResponseForm === 'accept' ? 'Accept this offer?' : 'Decline this offer?'}
              </h3>
              <textarea
                value={responseMessage}
                onChange={(e) => setResponseMessage(e.target.value)}
                placeholder="Add a message (optional)..."
                maxLength={500}
                rows={2}
              />
              <div className="response-form-actions">
                <button
                  className="btn btn-secondary"
                  onClick={() => { setShowResponseForm(null); setResponseMessage(''); }}
                  disabled={responding}
                >
                  Back
                </button>
                <button
                  className={`btn ${showResponseForm === 'accept' ? 'btn-primary' : 'btn-danger'}`}
                  onClick={() => handleRespond(showResponseForm)}
                  disabled={responding}
                >
                  {responding
                    ? 'Processing...'
                    : showResponseForm === 'accept'
                      ? 'Confirm Accept'
                      : 'Confirm Decline'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Message thread */}
      <div className="message-thread">
        <h2>Messages</h2>

        <div className="messages-container">
          {messages.length === 0 ? (
            <p className="no-messages">No messages yet. Start the conversation!</p>
          ) : (
            messages.map((msg) => (
              <div
                key={msg._id}
                className={`message-bubble ${msg.sender?._id === user?._id ? 'mine' : 'theirs'}`}
              >
                <div className="message-header">
                  <span className="message-sender">{msg.sender?.username}</span>
                  <span className="message-time">{formatTime(msg.createdAt)}</span>
                </div>
                <p className="message-content">{msg.content}</p>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message input */}
        <form className="message-input-form" onSubmit={handleSendMessage}>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            maxLength={1000}
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={sendingMessage || !newMessage.trim()}
          >
            {sendingMessage ? '...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default OfferDetails;
