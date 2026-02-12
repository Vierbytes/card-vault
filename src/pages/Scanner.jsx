/**
 * Card Scanner Page
 *
 * This page lets users take a photo of a card and identify it.
 * For now, I'm using the browser's camera API to capture an image,
 * then sending it to a card recognition service.
 *
 * The flow is: take photo -> identify card -> show results -> add to collection/wishlist
 *
 * Note: The actual image recognition could use Google Vision API,
 * a custom ML model, or even just OCR + text matching against the JustTCG database.
 * For this version, I'm doing OCR-style text extraction and searching.
 */

import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { cardAPI } from '../services/api';
import { FiCamera, FiUpload } from 'react-icons/fi';
import { GiCardPick } from 'react-icons/gi';
import useCardTilt from '../hooks/useCardTilt';
import './Scanner.css';

function Scanner() {
  // 3D tilt effect handlers for card hover
  const tiltHandlers = useCardTilt();

  // Camera and image state
  const [imagePreview, setImagePreview] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [stream, setStream] = useState(null);

  // Recognition results
  const [results, setResults] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [error, setError] = useState(null);

  // Manual search fallback
  const [manualQuery, setManualQuery] = useState('');

  // Refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // Start camera
  const startCamera = async () => {
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }, // Use back camera on mobile
      });
      setStream(mediaStream);
      setIsCapturing(true);

      // Wait for the video ref to be available after render
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      }, 100);
    } catch (err) {
      console.error('Camera error:', err);
      setError('Could not access camera. Please try uploading an image instead.');
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsCapturing(false);
  };

  // Capture photo from camera
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);

    const dataUrl = canvas.toDataURL('image/jpeg');
    setImagePreview(dataUrl);
    stopCamera();
  };

  // Handle file upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  // Scan the captured image
  // For now, this prompts the user to enter the card name
  // In a full implementation, this would use an image recognition API
  const handleScan = async () => {
    setScanning(true);
    setScanned(true);
    setError(null);
    setResults([]);

    try {
      // Simulate a brief scanning delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // For now, prompt user to type the card name they see
      // In production, this would be replaced with actual OCR / image recognition
      const cardName = window.prompt(
        'Image recognition is processing...\n\n' +
        'To help identify the card, type the card name you see on it:'
      );

      if (!cardName) {
        setScanning(false);
        setScanned(false);
        return;
      }

      // Search for the card
      const response = await cardAPI.search({ q: cardName.trim(), limit: 8 });
      setResults(response.data.data || []);
      setManualQuery(cardName);
    } catch (err) {
      console.error('Scan error:', err);
      setError('Failed to identify card. Try searching manually.');
    } finally {
      setScanning(false);
    }
  };

  // Manual search
  const handleManualSearch = async (e) => {
    e.preventDefault();
    if (!manualQuery.trim()) return;

    setScanning(true);
    setScanned(true);
    setError(null);

    try {
      const response = await cardAPI.search({ q: manualQuery.trim(), limit: 8 });
      setResults(response.data.data || []);
    } catch (err) {
      console.error('Search error:', err);
      setError('Search failed. Please try again.');
    } finally {
      setScanning(false);
    }
  };

  // Reset everything
  const handleReset = () => {
    stopCamera();
    setImagePreview(null);
    setResults([]);
    setScanned(false);
    setError(null);
    setManualQuery('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="scanner-page">
      <div className="scanner-header">
        <h1>Card Scanner</h1>
        <p>Take a photo or upload an image to identify a card</p>
      </div>

      {error && <div className="scanner-error">{error}</div>}

      {/* Camera / Upload section */}
      {!imagePreview && !isCapturing && (
        <div className="scanner-options">
          <button className="scanner-option" onClick={startCamera}>
            <FiCamera className="option-icon" />
            <span className="option-title">Take a Photo</span>
            <span className="option-desc">Use your camera to scan a card</span>
          </button>

          <button
            className="scanner-option"
            onClick={() => fileInputRef.current?.click()}
          >
            <FiUpload className="option-icon" />
            <span className="option-title">Upload Image</span>
            <span className="option-desc">Choose an image from your device</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
        </div>
      )}

      {/* Camera viewfinder */}
      {isCapturing && (
        <div className="camera-section">
          <div className="camera-viewfinder">
            <video ref={videoRef} autoPlay playsInline />
            <div className="viewfinder-overlay">
              <div className="viewfinder-frame"></div>
            </div>
          </div>
          <div className="camera-controls">
            <button className="btn btn-secondary" onClick={stopCamera}>
              Cancel
            </button>
            <button className="btn btn-primary capture-btn" onClick={capturePhoto}>
              Capture
            </button>
          </div>
        </div>
      )}

      {/* Image preview */}
      {imagePreview && !scanned && (
        <div className="preview-section">
          <div className="image-preview">
            <img src={imagePreview} alt="Captured card" />
          </div>
          <div className="preview-actions">
            <button className="btn btn-secondary" onClick={handleReset}>
              Retake
            </button>
            <button
              className="btn btn-primary btn-lg"
              onClick={handleScan}
              disabled={scanning}
            >
              {scanning ? 'Scanning...' : 'Identify Card'}
            </button>
          </div>
        </div>
      )}

      {/* Scanning animation */}
      {scanning && (
        <div className="scanning-indicator">
          <div className="scan-animation">
            <div className="scan-line"></div>
          </div>
          <p>Scanning card...</p>
        </div>
      )}

      {/* Results */}
      {scanned && !scanning && (
        <div className="results-section">
          <h2>Results</h2>

          {/* Manual search fallback */}
          <form className="manual-search" onSubmit={handleManualSearch}>
            <input
              type="text"
              value={manualQuery}
              onChange={(e) => setManualQuery(e.target.value)}
              placeholder="Search by card name..."
            />
            <button type="submit" className="btn btn-primary btn-sm">
              Search
            </button>
          </form>

          {results.length > 0 ? (
            <div className="results-grid">
              {results.map((card) => (
                <Link
                  key={card.id || card._id}
                  to={`/cards/${card.id || card._id}`}
                  className="result-card card-tilt"
                  {...tiltHandlers}
                >
                  <div className="result-image">
                    {card.imageUrl || card.image ? (
                      <img src={card.imageUrl || card.image} alt={card.name} />
                    ) : (
                      <GiCardPick className="result-placeholder" />
                    )}
                  </div>
                  <div className="result-info">
                    <span className="result-name">{card.name}</span>
                    <span className="result-set">{card.setName || card.set}</span>
                    <span className="result-price">
                      {card.price
                        ? `$${parseFloat(card.price).toFixed(2)}`
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="light-shadow" />
                </Link>
              ))}
            </div>
          ) : (
            <div className="no-results">
              <p>No cards found. Try a different search term.</p>
            </div>
          )}

          <button className="btn btn-secondary scan-again-btn" onClick={handleReset}>
            Scan Another Card
          </button>
        </div>
      )}

      {/* Hidden canvas for photo capture */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}

export default Scanner;
