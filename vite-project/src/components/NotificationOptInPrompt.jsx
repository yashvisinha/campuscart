import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { getUserId } from '../auth.js';
import { getPushPermissionState, requestPushPermissionAndEnable } from '../utils/pushNotifications.js';
import './NotificationOptInPrompt.css';

export default function NotificationOptInPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const userId = getUserId();
    if (!userId) return;

    const permState = getPushPermissionState();
    const userChoice = localStorage.getItem('push_opt_in_choice');

    // Show prompt ONLY if permission is default (not granted yet) and user has not already chosen
    if (permState === 'default' && !userChoice) {
      setShowPrompt(true);
    } else {
      setShowPrompt(false);
    }
  }, []);

  const handleEnable = async () => {
    // Immediately persist choice so banner never re-appears repeatedly
    localStorage.setItem('push_opt_in_choice', 'enabled');
    setShowPrompt(false);
    setLoading(true);

    try {
      await requestPushPermissionAndEnable();
    } catch (err) {
      console.error('Error requesting push permission:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('push_opt_in_choice', 'dismissed');
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="push-optin-overlay">
      <div className="push-optin-card">
        <div className="push-optin-header">
          <div className="push-optin-icon">
            <Bell size={22} />
          </div>
          <div className="push-optin-text">
            <h3>Enable Notifications?</h3>
            <p>Get instant alerts for new messages, orders, and deal updates on your phone.</p>
          </div>
        </div>

        <div className="push-optin-actions">
          <button className="push-btn-dismiss" onClick={handleDismiss} disabled={loading}>
            Not now
          </button>
          <button className="push-btn-enable" onClick={handleEnable} disabled={loading}>
            {loading ? 'Enabling...' : 'Enable Notifications'}
          </button>
        </div>
      </div>
    </div>
  );
}
