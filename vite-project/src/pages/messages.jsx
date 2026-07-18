import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Settings as SettingsIcon,
  Bell as BellIcon,
} from "lucide-react";
import "./messages.css";

// Get the logged-in user's ID (we stored it during DAuth login)
function getCurrentUserId() {
  try {
    const user = JSON.parse(localStorage.getItem('dauth_user'));
    if (user?.email) {
      return user.email.split('@')[0].toLowerCase();
    }
    if (user?.name) {
      return user.name.toLowerCase().replace(/\s+/g, '');
    }
    return 'hiba';
  } catch {
    return 'hiba';
  }
}

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

function MessageRow({ userId, lastMessage, time, unread, onClick }) {
  return (
    <article
      className={`message-card${unread ? " message-card-unread" : ""}`}
      onClick={onClick}
      style={{ cursor: 'pointer' }}
    >
      <div className="message-avatar" aria-hidden="true">
        {userId
          .split(" ")
          .map((word) => word[0]?.toUpperCase())
          .slice(0, 2)
          .join("")}
      </div>

      <div className="message-body">
        <div className="message-topline">
          <h2>{userId}</h2>
          <span>{formatTime(time)}</span>
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
  const currentUser = getCurrentUserId();

  useEffect(() => {
    fetch(`/api/messages/chats/${currentUser}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setChats(data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch chats:', err);
        setLoading(false);
      });
  }, [currentUser]);

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