import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, LogOut } from 'lucide-react';
import './SettingsPage.css';           // ← Now importing from same folder

import pfpDefault from '../assets/pfpDefault.png';

function SettingsPage() {
  const navigate = useNavigate();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [isComingSoonOpen, setIsComingSoonOpen] = useState(false);
  const [comingSoonTitle, setComingSoonTitle] = useState("");

  const [userName, setUserName] = useState("Your Name");
  const [address, setAddress] = useState("OPAL-C 99W");
  const [profilePic, setProfilePic] = useState(pfpDefault);

  // Load user data from DAuth local session
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('dauth_user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        if (user.name) setUserName(user.name);
        if (user.email) setAddress(user.email);
      }
    } catch (err) {
      console.error('Failed to load user info:', err);
    }
  }, []);

  // Logout Logic
  const handleLogout = () => {
    localStorage.removeItem('dauth_user');
    localStorage.removeItem('dauth_token');
    navigate('/login');
  };

  // Edit Profile Picture
  const openEditModal = () => setIsEditOpen(true);
  const closeEditModal = () => setIsEditOpen(false);

  // Reset Password
  const openResetPasswordModal = () => setIsResetPasswordOpen(true);
  const closeResetModal = () => setIsResetPasswordOpen(false);

  // Coming Soon
  const openComingSoon = (title) => {
    setComingSoonTitle(title);
    setIsComingSoonOpen(true);
  };
  const closeComingSoon = () => setIsComingSoonOpen(false);

  const handlePfpChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setProfilePic(imageUrl);
    }
  };

  const savePfpChanges = () => {
    setIsEditOpen(false);
  };

  return (
    <div className="settings-container">
      {/* Header */}
      <div className="settings-header">
        <button className="back-btn" onClick={() => navigate('/home')}>←</button>
        <h1>Settings</h1>
      </div>

      {/* Profile Card */}
      <div className="profile-card">
        <div className="profile-label">Profile</div>

        <div className="profile-content">
          <div className="avatar">
            <img src={profilePic} alt="Profile" />
          </div>

          <div className="info-section">
            <h2 className="user-name">{userName}</h2>
            <p className="address">{address}</p>
            <button className="edit-btn" onClick={openEditModal}>Edit</button>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="menu-list">
        <div className="menu-item" onClick={openResetPasswordModal}>
          <span>Reset Password</span>
          <ArrowRight size={22} />
        </div>
        <div className="menu-item" onClick={() => openComingSoon("Bank/UPI Details")}>
          <span>Bank/UPI Details</span>
          <ArrowRight size={22} />
        </div>
        <div className="menu-item" onClick={() => openComingSoon("IDK Something")}>
          <span>IDK Something</span>
          <ArrowRight size={22} />
        </div>
        <div className="menu-item" onClick={() => openComingSoon("Support")}>
          <span>Support</span>
          <ArrowRight size={22} />
        </div>
      </div>

      {/* Logout Button */}
      <button className="logout-btn" onClick={handleLogout}>
        <LogOut size={24} />
        Logout
      </button>

      {/* ====================== Edit Profile Picture Modal ====================== */}
      {isEditOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Edit Profile Picture</h2>
            </div>

            <div className="modal-body">
              <div className="input-group">
                <div className="file-input">
                  <button className="choose-file-btn" onClick={() => document.getElementById('pfp-input').click()}>
                    Choose File
                  </button>
                  <span className="file-name">No file chosen</span>
                </div>
                <input
                  id="pfp-input"
                  type="file"
                  accept="image/*"
                  onChange={handlePfpChange}
                  style={{ display: 'none' }}
                />
              </div>

              <p className="note">Other details are fetched from DAuth and cannot be changed manually.</p>
            </div>

            <div className="modal-footer">
              <button className="cancel-btn" onClick={closeEditModal}>Cancel</button>
              <button className="save-btn" onClick={savePfpChanges}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* ====================== Reset Password Modal ====================== */}
      {isResetPasswordOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Reset Password</h2>
            </div>

            <div className="modal-body">
              <div className="input-group">
                <label>Current Password</label>
                <input type="password" placeholder="Enter current password" />
              </div>
              <div className="input-group">
                <label>New Password</label>
                <input type="password" placeholder="Enter new password" />
              </div>
              <div className="input-group">
                <label>Confirm New Password</label>
                <input type="password" placeholder="Confirm new password" />
              </div>
            </div>

            <div className="modal-footer">
              <button className="cancel-btn" onClick={closeResetModal}>Cancel</button>
              <button className="save-btn">Reset Password</button>
            </div>
          </div>
        </div>
      )}

      {/* ====================== Coming Soon Modal ====================== */}
      {isComingSoonOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{comingSoonTitle}</h2>
            </div>

            <div className="modal-body" style={{ textAlign: 'center', padding: '50px 20px' }}>
              <p style={{ fontSize: '18px', color: '#a0d8d0' }}>
                This feature is coming soon!
              </p>
            </div>

            <div className="modal-footer">
              <button className="save-btn" onClick={closeComingSoon}>OK</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SettingsPage;