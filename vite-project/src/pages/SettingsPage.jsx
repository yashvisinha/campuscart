import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, LogOut } from 'lucide-react';
import './SettingsPage.css';           // ← Now importing from same folder

import pfpDefault from '../assets/pfpDefault.png';
import { logout } from '../auth';

function SettingsPage() {
  const navigate = useNavigate();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const [suggestionText, setSuggestionText] = useState("");
  const [suggestionSubmitted, setSuggestionSubmitted] = useState(false);
  const [suggestionSubmitting, setSuggestionSubmitting] = useState(false);

  const [userName, setUserName] = useState("Your Name");
  const [address, setAddress] = useState("OPAL-C 99W");
  const [profilePic, setProfilePic] = useState(pfpDefault);
  const [tempPfp, setTempPfp] = useState(null);
  const [selectedFileName, setSelectedFileName] = useState("");

  // Load user data from DAuth local session & saved PFP
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('dauth_user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        if (user.name) setUserName(user.name);
        if (user.email) setAddress(user.email);
      }
      const savedPfp = localStorage.getItem('dauth_user_pfp');
      if (savedPfp) {
        setProfilePic(savedPfp);
      }
    } catch (err) {
      console.error('Failed to load user info:', err);
    }
  }, []);

  // Logout Logic
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Edit Profile Picture
  const openEditModal = () => {
    setTempPfp(null);
    setSelectedFileName("");
    setIsEditOpen(true);
  };
  const closeEditModal = () => {
    setTempPfp(null);
    setSelectedFileName("");
    setIsEditOpen(false);
  };

  const handlePfpChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        setTempPfp(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const savePfpChanges = () => {
    if (tempPfp) {
      setProfilePic(tempPfp);
      try {
        localStorage.setItem('dauth_user_pfp', tempPfp);
      } catch (err) {
        console.error('Failed to save profile picture to localStorage:', err);
      }
    }
    setIsEditOpen(false);
  };

  const handleSuggestionSubmit = async () => {
    if (!suggestionText.trim()) return;
    setSuggestionSubmitting(true);
    try {
      let userId = null;
      let userNameVal = null;
      const storedUser = localStorage.getItem('dauth_user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        userId = user.id || user.userId || null;
        userNameVal = user.name || null;
      }

      const res = await fetch('/api/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          user_name: userNameVal,
          suggestion: suggestionText.trim(),
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to submit suggestion');
      }

      setSuggestionSubmitted(true);
    } catch (err) {
      console.error('Suggestion submit error:', err);
      alert(err.message || 'Failed to submit suggestion. Please try again.');
    } finally {
      setSuggestionSubmitting(false);
    }
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
        <div className="menu-item" onClick={() => setIsSupportOpen(true)}>
          <span>Support</span>
          <ArrowRight size={22} />
        </div>
        <div className="menu-item" onClick={() => setIsContactOpen(true)}>
          <span>About</span>
          <ArrowRight size={22} />
        </div>
        <div className="menu-item" onClick={() => { setSuggestionText(""); setSuggestionSubmitted(false); setIsSuggestionsOpen(true); }}>
          <span>Suggestions</span>
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
                  <span className="file-name">{selectedFileName || "No file chosen"}</span>
                </div>
                {tempPfp && (
                  <div style={{ marginTop: '12px', textAlign: 'center' }}>
                    <img
                      src={tempPfp}
                      alt="Preview"
                      style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #58aeb0' }}
                    />
                  </div>
                )}
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

      {/* ====================== Support Modal ====================== */}
      {isSupportOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Support</h2>
            </div>
            <div className="modal-body" style={{ textAlign: 'center', padding: '30px 20px' }}>
              <p style={{ fontSize: '15px', color: '#a0d8d0', marginBottom: '8px' }}>
                For queries or assistance, email us at:
              </p>
              <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#bffcff' }}>
                campuscartexec@gmail.com
              </p>
            </div>
            <div className="modal-footer">
              <button className="save-btn" onClick={() => setIsSupportOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ====================== Contact Us Modal ====================== */}
      {isContactOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>About</h2>
            </div>
            <div className="modal-body" style={{ textAlign: 'center', padding: '30px 20px' }}>
              <p style={{ fontSize: '15px', color: '#a0d8d0', marginBottom: '8px' }}>
                A student-developed project by:
              </p>
              <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#bffcff' }}>
                Yashvi, Hiba & Joliene
              </p>
            </div>
            <div className="modal-footer">
              <button className="save-btn" onClick={() => setIsContactOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ====================== Suggestions Modal ====================== */}
      {isSuggestionsOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Suggestions</h2>
            </div>
            <div className="modal-body">
              {suggestionSubmitted ? (
                <div style={{ textAlign: 'center', padding: '20px 10px' }}>
                  <p style={{ fontSize: '16px', color: '#bffcff', fontWeight: 600 }}>
                    Thank you for your suggestion!
                  </p>
                </div>
              ) : (
                <div className="input-group">
                  <label style={{ marginBottom: '8px', display: 'block', color: '#a0d8d0', fontSize: '14px' }}>
                    Share your feedback or suggestions:
                  </label>
                  <textarea
                    rows="4"
                    value={suggestionText}
                    onChange={(e) => setSuggestionText(e.target.value)}
                    placeholder="Type your suggestion here..."
                    style={{
                      width: '100%',
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid #58aeb0',
                      borderRadius: '8px',
                      color: '#fff',
                      padding: '10px',
                      fontSize: '14px',
                      resize: 'none',
                      outline: 'none',
                    }}
                  />
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setIsSuggestionsOpen(false)}>
                {suggestionSubmitted ? 'Close' : 'Cancel'}
              </button>
              {!suggestionSubmitted && (
                <button
                  className="save-btn"
                  onClick={handleSuggestionSubmit}
                  disabled={!suggestionText.trim() || suggestionSubmitting}
                >
                  {suggestionSubmitting ? 'Submitting...' : 'Submit'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SettingsPage;