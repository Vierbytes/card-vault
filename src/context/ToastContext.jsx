/**
 * Toast Context
 *
 * Global notification system for the app. Instead of each page
 * managing its own toast state (like I was doing in CardDetails
 * and Wishlist), this provides a single showToast() function
 * that any component can use.
 *
 * Works just like AuthContext - wrap the app in ToastProvider,
 * then call useToast() in any component to get showToast().
 */

import { createContext, useContext, useState, useCallback } from 'react';
import './ToastContext.css';

// Create the context
const ToastContext = createContext(null);

// Simple counter for unique toast IDs
let toastIdCounter = 0;

/**
 * Toast Provider Component
 *
 * Manages the toast state and renders them in a fixed container.
 * Toasts auto-dismiss after 3 seconds with a fade-out animation.
 */
export function ToastProvider({ children }) {
  // Array of active toasts - each has { id, message, type, exiting }
  const [toasts, setToasts] = useState([]);

  /**
   * Show a toast notification
   *
   * @param {string} message - The text to display
   * @param {string} type - 'success', 'error', or 'info'
   */
  const showToast = useCallback((message, type = 'success') => {
    const id = ++toastIdCounter;

    // Add the new toast to the array
    setToasts((prev) => [...prev, { id, message, type, exiting: false }]);

    // After 2.5 seconds, start the fade-out animation
    setTimeout(() => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, exiting: true } : t))
      );
    }, 2500);

    // After 3 seconds total, remove it from the array
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Toast container - renders on top of everything */}
      {toasts.length > 0 && (
        <div className="toast-container">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`toast-notification ${toast.type} ${toast.exiting ? 'exiting' : ''}`}
            >
              {toast.message}
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
}

/**
 * Custom hook to use the toast context
 *
 * Usage: const { showToast } = useToast();
 *        showToast('Something happened!', 'success');
 */
export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  return context;
}
