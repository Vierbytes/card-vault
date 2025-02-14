/**
 * Theme Context
 *
 * Manages light/dark mode for the app. I learned about CSS custom properties
 * and how you can override them with a data attribute on the html element.
 * This way all the colors switch automatically without changing each component.
 *
 * The theme is saved in localStorage so it persists across sessions.
 * If there's no saved preference, it checks the user's OS setting
 * (like if they have dark mode enabled on their Mac/PC).
 *
 * Also renders a floating toggle button in the bottom-right corner
 * with Pokemon ball sprites - similar to how ToastContext renders
 * the toast container on top of everything.
 */

import { createContext, useContext, useState, useEffect } from 'react';
import './ThemeContext.css';

// Create the context
const ThemeContext = createContext(null);

// Sprite URLs from PokeAPI - master ball for dark, premier ball for light
const PREMIER_BALL =
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/premier-ball.png';
const MASTER_BALL =
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/master-ball.png';

/**
 * Theme Provider Component
 *
 * Wraps the app and provides theme state + toggle function.
 * Sets a data-theme attribute on the html element so our CSS
 * variables in App.css can switch between light and dark palettes.
 * Renders a floating Poke Ball toggle button in the bottom-right corner.
 */
export function ThemeProvider({ children }) {
  // Initialize theme from localStorage or system preference
  const [theme, setTheme] = useState(() => {
    // Check if user already picked a theme before
    const saved = localStorage.getItem('theme');
    if (saved) return saved;

    // No saved preference - check what the OS is set to
    // This uses the prefers-color-scheme media query
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  });

  // Apply the theme whenever it changes
  // This sets data-theme="dark" or data-theme="light" on the <html> tag
  // which triggers our CSS variable overrides in App.css
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Toggle between light and dark
  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}

      {/* Floating theme toggle - always visible in bottom-right corner */}
      <button
        className="theme-toggle-fab"
        onClick={toggleTheme}
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      >
        <img
          src={theme === 'light' ? MASTER_BALL : PREMIER_BALL}
          alt={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          className="theme-toggle-fab-icon"
        />
      </button>
    </ThemeContext.Provider>
  );
}

/**
 * Custom hook to use the theme context
 *
 * Usage: const { theme, toggleTheme } = useTheme();
 */
export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
}
