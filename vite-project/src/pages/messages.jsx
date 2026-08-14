import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Settings as SettingsIcon,
  Bell as BellIcon,
} from "lucide-react";
import { getUserId } from "../auth";
import { API_BASE } from '../config.js';
import "./messages.css";

// Format timestamp to relative time like "2m", "1h", "Yesterday"
function formatTime(timestamp) {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'now';
  if (diffMin < 60) return `${diffMin}m`;
  if (diffHr < 24) return `${diffHr}h`;
  if (diffDay === 1) return 'Yesterday';
  return `${diffDay}d`;
}

// Header component
function Header() {
  const navigate = useNavigate();

  return (
    <header className="topbar">
      <button className="icon-btn" aria-label="settings" onClick={() => navigate('/settings')}>
        <SettingsIcon size={28} />
      </button>

      <div className="search-pill">
        <span className="search-mark">⌕</span>
        <input type="text" placeholder="Search" aria-label="Search" />
      </div>

      <button className="icon-btn" aria-label="notifications" onClick={() => navigate('/notifications')}>
        <BellIcon size={28} />
      </button>
    </header>
  );
}

function MessageRow({ userId, displayName, profilePicUrl, lastMessage, time, unread, unreadCount, onClick }) {
  const nameToShow = displayName || userId;
  return (
    <article
      className={`message-card${unread ? " message-card-unread" : ""}`}
      onClick={onClick}
      style={{ cursor: 'pointer' }}
    >
      <div className="message-avatar" aria-hidden="true">
        {profilePicUrl ? (
          <img
            src={profilePicUrl}
            alt={nameToShow}
            style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
          />
        ) : (
          String(nameToShow)
            .split(" ")
            .map((word) => word[0]?.toUpperCase())
            .slice(0, 2)
            .join("")
        )}
      </div>

      <div className="message-body">
        <div className="message-topline">
          <h2>{nameToShow}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {unreadCount > 0 && (
              <span
                style={{
                  background: '#ff7d7b',
                  color: '#fff',
                  fontSize: '10px',
                  fontWeight: '700',
                  padding: '2px 6px',
                  borderRadius: '10px',
                  lineHeight: 1,
                }}
              >
                {unreadCount}
              </span>
            )}
            <span>{formatTime(time)}</span>
          </div>
        </div>
        <p>{lastMessage}</p>
      </div>
    </article>
  );
}

export default function Messages() {
  const navigate = useNavigate();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const currentUser = getUserId();

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    const fetchChats = () => {
      fetch(`${API_BASE}/api/messages/chats/${currentUser}`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            const sorted = [...data].sort(
              (a, b) => new Date(b.time || 0) - new Date(a.time || 0)
            );
            setChats(sorted);
          }
          setLoading(false);
        })
        .catch((err) => {
          console.error('Failed to fetch chats:', err);
          setLoading(false);
        });
    };

    fetchChats();
    const interval = setInterval(fetchChats, 3000);
    window.addEventListener('unread-messages-updated', fetchChats);

    return () => {
      clearInterval(interval);
      window.removeEventListener('unread-messages-updated', fetchChats);
    };
  }, [currentUser, navigate]);

  return (
    <>
      <Header />

      <section className="hero">
        <h1 className="hero-title">Messages</h1>
      </section>

      <section className="messages-list" aria-label="Recent messages">
        {loading ? (
          <p style={{ color: '#888', textAlign: 'center', padding: '40px 0' }}>Loading chats...</p>
        ) : chats.length === 0 ? (
          <p style={{ color: '#888', textAlign: 'center', padding: '40px 0' }}>No conversations yet</p>
        ) : (
          chats.map((chat) => (
            <MessageRow
              key={chat.userId}
              {...chat}
              onClick={() => navigate(`/conversation/${chat.userId}`)}
            />
          ))
        )}
      </section>
    </>
  );
}