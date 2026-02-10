/**
 * Profile Page
 *
 * Lets the user edit their account settings like username, bio,
 * favorite games, and password. I split it into two sections -
 * profile info and password change - so they're clearly separate.
 */

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../services/api';
import './Profile.css';

function Profile() {
  const { user, updateUser } = useAuth();

  // Profile form state - pre-fill with current user data
  const [profileData, setProfileData] = useState({
    username: user?.username || '',
    bio: user?.bio || '',
    favoriteGames: user?.favoriteGames || [],
  });

  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // UI state
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [profileError, setProfileError] = useState(null);
  const [passwordError, setPasswordError] = useState(null);

  // Available games - matches the User model enum
  const availableGames = [
    { id: 'pokemon', name: 'Pokemon' },
    { id: 'magic', name: 'Magic: The Gathering' },
    { id: 'yugioh', name: 'Yu-Gi-Oh!' },
    { id: 'lorcana', name: 'Lorcana' },
    { id: 'onepiece', name: 'One Piece' },
    { id: 'digimon', name: 'Digimon' },
    { id: 'union-arena', name: 'Union Arena' },
  ];

  // Show a temporary toast
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Handle profile field changes
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
    setProfileError(null);
  };

  // Handle favorite games toggle
  const toggleGame = (gameId) => {
    setProfileData((prev) => ({
      ...prev,
      favoriteGames: prev.favoriteGames.includes(gameId)
        ? prev.favoriteGames.filter((g) => g !== gameId)
        : [...prev.favoriteGames, gameId],
    }));
  };

  // Save profile changes
  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSaving(true);

    try {
      const response = await userAPI.updateProfile(profileData);
      // Update the global auth state with new user data
      updateUser(response.data.data);
      showToast('Profile updated!');
    } catch (err) {
      console.error('Error updating profile:', err);
      setProfileError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setProfileSaving(false);
    }
  };

  // Handle password field changes
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
    setPasswordError(null);
  };

  // Save new password
  const handlePasswordSave = async (e) => {
    e.preventDefault();
    setPasswordError(null);

    // Validation
    if (passwordData.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    setPasswordSaving(true);

    try {
      await userAPI.updatePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      // Clear form on success
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      showToast('Password updated!');
    } catch (err) {
      console.error('Error updating password:', err);
      setPasswordError(err.response?.data?.message || 'Failed to update password');
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div className="profile-page">
      {/* Toast notification */}
      {toast && (
        <div className={`toast ${toast.type}`}>{toast.message}</div>
      )}

      <div className="profile-header">
        <h1>Profile Settings</h1>
        <p>Manage your account information</p>
      </div>

      {/* Profile info section */}
      <section className="profile-section">
        <h2>Profile Information</h2>

        {profileError && <div className="error-box">{profileError}</div>}

        <form onSubmit={handleProfileSave}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={profileData.username}
              onChange={handleProfileChange}
              minLength="3"
              maxLength="30"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={user?.email || ''}
              disabled
              className="disabled-input"
            />
            <span className="input-hint">Email cannot be changed</span>
          </div>

          <div className="form-group">
            <label htmlFor="bio">Bio</label>
            <textarea
              id="bio"
              name="bio"
              value={profileData.bio}
              onChange={handleProfileChange}
              placeholder="Tell other collectors about yourself..."
              rows="3"
              maxLength="500"
            />
          </div>

          <div className="form-group">
            <label>Favorite Games</label>
            <div className="games-grid">
              {availableGames.map((game) => (
                <button
                  key={game.id}
                  type="button"
                  className={`game-chip ${
                    profileData.favoriteGames.includes(game.id) ? 'selected' : ''
                  }`}
                  onClick={() => toggleGame(game.id)}
                >
                  {game.name}
                </button>
              ))}
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={profileSaving}>
            {profileSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </section>

      {/* Password section */}
      <section className="profile-section">
        <h2>Change Password</h2>

        {passwordError && <div className="error-box">{passwordError}</div>}

        <form onSubmit={handlePasswordSave}>
          <div className="form-group">
            <label htmlFor="currentPassword">Current Password</label>
            <input
              type="password"
              id="currentPassword"
              name="currentPassword"
              value={passwordData.currentPassword}
              onChange={handlePasswordChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="newPassword">New Password</label>
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              value={passwordData.newPassword}
              onChange={handlePasswordChange}
              minLength="6"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={passwordData.confirmPassword}
              onChange={handlePasswordChange}
              required
            />
          </div>

          <button type="submit" className="btn btn-secondary" disabled={passwordSaving}>
            {passwordSaving ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </section>
    </div>
  );
}

export default Profile;
