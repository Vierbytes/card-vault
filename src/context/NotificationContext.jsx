/**
 * Notification Context
 *
 * Polls the backend every 30 seconds for unread notification count
 * so the bell icon in the navbar can show a badge. Only polls when
 * the user is logged in.
 *
 * I learned that setInterval can cause memory leaks if you don't
 * clean up, so the useEffect returns a cleanup function that clears
 * the interval when the component unmounts or the user logs out.
 *
 * I'm also using "optimistic UI updates" here - when the user marks
 * a notification as read, I update the local state immediately instead
 * of waiting for the server response. This makes the UI feel snappy.
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { notificationAPI } from '../services/api';

// Create the context
const NotificationContext = createContext(null);

/**
 * Notification Provider Component
 *
 * Wraps the app and provides notification state + actions to all children.
 */
export function NotificationProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch just the unread count (lightweight - used for polling)
  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return;
    }

    try {
      const response = await notificationAPI.getUnreadCount();
      setUnreadCount(response.data.count);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  }, [isAuthenticated]);

  // Fetch the full notification list (used when opening the dropdown)
  const fetchNotifications = async () => {
    if (!isAuthenticated) return;

    setLoading(true);
    try {
      const response = await notificationAPI.getAll({ limit: 10 });
      setNotifications(response.data.data);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mark a single notification as read
  // Uses optimistic update - decrement the count right away
  const markAsRead = async (notificationId) => {
    try {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n._id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      await notificationAPI.markAsRead(notificationId);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      // If it fails, the next poll will correct the count
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      // Optimistic update
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);

      await notificationAPI.markAllAsRead();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  // Poll for unread count every 30 seconds when authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      setNotifications([]);
      return;
    }

    // Fetch immediately when user logs in
    fetchUnreadCount();

    // Then poll every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);

    // Cleanup: stop polling when component unmounts or user logs out
    return () => clearInterval(interval);
  }, [isAuthenticated, fetchUnreadCount]);

  const value = {
    unreadCount,
    notifications,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    refreshUnreadCount: fetchUnreadCount,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

/**
 * Custom hook for using the notification context
 */
export function useNotifications() {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }

  return context;
}
