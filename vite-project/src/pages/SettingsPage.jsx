import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, LogOut, Bell } from 'lucide-react';
import './SettingsPage.css';           // ← Now importing from same folder

import pfpDefault from '../assets/pfpDefault.png';
import { logout, getUser, getUserId } from '../auth';
import { HOSTEL_NAMES } from '../constants/hostels';
import { API_BASE } from '../config.js';
import {
  getPushPermissionState,
  requestPushPermissionAndEnable,
  unsubscribeUserFromPush,
} from '../utils/pushNotifications.js';

function SettingsPage() {
  const navigate = useNavigate();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const [suggestionText, setSuggestionText] = useState("");
  const [suggestionSubmitted, setSuggestionSubmitted] = useState(false);
  const [suggestionSubmitting, setSuggestionSubmitting] = useState(false);

  const [pushStatus, setPushStatus] = useState('default');
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);

  useEffect(() => {
    const state = getPushPermissionState();
    setPushStatus(state);
    const userChoice = localStorage.getItem('push_opt_in_choice');
    setPushEnabled(state === 'granted' && userChoice !== 'disabled');
  }, []);

  const handlePushToggle = async () => {
    setPushLoading(true);
    try {
      if (pushEnabled) {
        await unsubscribeUserFromPush();
        setPushEnabled(false);
      } else {
        if (pushStatus === 'denied') {
          alert('Push notifications are blocked in your browser site settings. Please unblock notifications in site settings.');
          return;
        }
        const perm = await requestPushPermissionAndEnable();
        const newState = getPushPermissionState();
        setPushStatus(newState);
        setPushEnabled(perm === 'granted');
      }
    } catch (err) {
      console.error('Failed to toggle push notifications:', err);
    } finally {
      setPushLoading(false);
    }
  };

  const [userName, setUserName] = useState("Your Name");
  const [hostel, setHostel] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [profilePic, setProfilePic] = useState(pfpDefault);
  const [tempPfp, setTempPfp] = useState(null);
  const [tempHostel, setTempHostel] = useState("");
  const [tempRoomNumber, setTempRoomNumber] = useState("");
  const [selectedFileName, setSelectedFileName] = useState("");

  // Load user data from DAuth local session, saved hostel/room & saved PFP
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('dauth_user');
      const savedHostel = localStorage.getItem('dauth_user_hostel');
      const savedRoom = localStorage.getItem('dauth_user_room');

      if (savedHostel) setHostel(savedHostel);
      if (savedRoom) setRoomNumber(savedRoom);

      // Legacy fallback: parse old combined address if new keys missing
      if (!savedHostel && !savedRoom) {
        const savedAddress = localStorage.getItem('dauth_user_address');
        if (savedAddress) {
          // Try to split legacy "HOSTEL ROOM" format
          const parts = savedAddress.split(' ');
          if (parts.length >= 2) {
            setRoomNumber(parts.pop());
            setHostel(parts.join(' '));
          } else {
            setHostel(savedAddress);
          }
        }
      }

      if (storedUser) {
        const user = JSON.parse(storedUser);
        if (user.name) setUserName(user.name);
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

  // Edit Profile (Pfp and Address)
  const openEditModal = () => {
    setTempPfp(null);
    setTempHostel(hostel);
    setTempRoomNumber(roomNumber);
    setSelectedFileName("");
    setIsEditOpen(true);
  };
  const closeEditModal = () => {
    setTempPfp(null);
    setTempHostel("");
    setTempRoomNumber("");
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

  const saveProfileChanges = () => {
    if (tempPfp) {
      setProfilePic(tempPfp);
      try {
        localStorage.setItem('dauth_user_pfp', tempPfp);
      } catch (err) {
        console.error('Failed to save profile picture to localStorage:', err);
      }
    }

    // Validate hostel is from the allowed list (or empty)
    if (tempHostel && !HOSTEL_NAMES.includes(tempHostel)) {
      alert('Please select a valid hostel from the list.');
      return;
    }

    // Save hostel and room number separately
    const updatedHostel = tempHostel;
    const updatedRoom = tempRoomNumber.trim();
    setHostel(updatedHostel);
    setRoomNumber(updatedRoom);
    try {
      localStorage.setItem('dauth_user_hostel', updatedHostel);
      localStorage.setItem('dauth_user_room', updatedRoom);
      // Also update the legacy combined address for backward compat
      const combined = [updatedHostel, updatedRoom].filter(Boolean).join(' ');
      localStorage.setItem('dauth_user_address', combined);
      const storedUser = localStorage.getItem('dauth_user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        user.address = combined;
        localStorage.setItem('dauth_user', JSON.stringify(user));
      }

      // Sync to backend
      const userId = getUserId();
      if (userId) {
        const user = getUser();
        fetch(`${API_BASE}/api/profiles/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roll_no: userId,
            full_name: user?.name || undefined,
            hostel: updatedHostel,
            room_number: updatedRoom,
            profile_pic_url: tempPfp || profilePic,
          }),
        }).catch(() => {});
      }
    } catch (err) {
      console.error('Failed to save hostel/room to localStorage:', err);
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
            <p className="address">{[hostel, roomNumber].filter(Boolean).join(' ') || 'Not set'}</p>
            <button className="edit-btn" onClick={openEditModal}>Edit</button>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="menu-list">
        <div className="menu-item" style={{ cursor: 'default', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Bell size={20} color="#a0d8d0" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ fontSize: '15px', fontWeight: '600', color: '#e2e3df' }}>Push Notifications</span>
              <span style={{ fontSize: '12px', color: pushStatus === 'denied' ? '#ff686b' : '#a0d8d0' }}>
                {pushStatus === 'denied'
                  ? 'Blocked in browser settings'
                  : pushEnabled
                  ? 'Enabled'
                  : 'Disabled'}
              </span>
            </div>
          </div>
          <button
            type="button"
            className="push-toggle-switch"
            onClick={handlePushToggle}
            disabled={pushLoading}
            style={{
              width: '46px',
              height: '26px',
              borderRadius: '13px',
              background: pushEnabled ? '#ff686b' : 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.2)',
              position: 'relative',
              cursor: 'pointer',
              transition: 'background 0.2s ease',
            }}
            aria-label="Toggle push notifications"
          >
            <span
              style={{
                position: 'absolute',
                top: '2px',
                left: pushEnabled ? '22px' : '2px',
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: '#ffffff',
                transition: 'left 0.2s ease',
                boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
              }}
            />
          </button>
        </div>

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

      {/* ====================== Edit Profile Modal ====================== */}
      {isEditOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Edit Profile</h2>
            </div>

            <div className="modal-body">
              <div className="input-group">
                <label style={{ display: 'block', marginBottom: '8px', color: '#a0d8d0', fontSize: '14px', fontWeight: 500 }}>
                  Profile Picture
                </label>
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

              <div className="input-group" style={{ marginTop: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#a0d8d0', fontSize: '14px', fontWeight: 500 }}>
                  Hostel
                </label>
                <select
                  className="settings-address-input"
                  value={tempHostel}
                  onChange={(e) => setTempHostel(e.target.value)}
                >
                  <option value="">Select your hostel</option>
                  {HOSTEL_NAMES.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>

              <div className="input-group" style={{ marginTop: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#a0d8d0', fontSize: '14px', fontWeight: 500 }}>
                  Room Number
                </label>
                <input
                  type="text"
                  className="settings-address-input"
                  value={tempRoomNumber}
                  onChange={(e) => setTempRoomNumber(e.target.value)}
                  placeholder="e.g. 99W"
                />
              </div>

              <p className="note" style={{ marginTop: '16px' }}>
                Name and email are fetched from DAuth. You can edit your hostel, room number, and profile picture.
              </p>
            </div>

            <div className="modal-footer">
              <button className="cancel-btn" onClick={closeEditModal}>Cancel</button>
              <button className="save-btn" onClick={saveProfileChanges}>Save Changes</button>
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