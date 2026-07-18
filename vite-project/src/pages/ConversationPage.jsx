import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';
import './ConversationPage.css';

// Same helper as messages.jsx to get logged-in user
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

export default function ConversationPage() {
  const { otherUserId } = useParams();
  const navigate = useNavigate();
  const currentUser = getCurrentUserId();

  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);

  // Fetch conversation on load
  useEffect(() => {
    fetch(`/api/messages/conversation/${currentUser}/${otherUserId}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setMessages(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching conversation:', err);
        setLoading(false);
      });
  }, [currentUser, otherUserId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send a new message
  const handleSend = async () => {
    const text = newMsg.trim();
    if (!text) return;

    // Optimistically add the message to the UI immediately
    const optimisticMsg = {
      id: Date.now(),
      sender_id: currentUser,
      receiver_id: otherUserId,
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimisticMsg]);
    setNewMsg('');

    // Then send to backend
    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_id: currentUser,
          receiver_id: otherUserId,
          content: text,
        }),
      });
    } catch (err) {
      console.error('Failed to send:', err);
    }
  };

  // Send on Enter key
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="convo-container" style={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <header className="convo-topbar">
        <button className="convo-back" onClick={() => navigate('/messages')} aria-label="Back">
          <ArrowLeft size={22} />
        </button>
        <div className="convo-avatar">
          {otherUserId.split(' ').map(w => w[0]?.toUpperCase()).slice(0, 2).join('')}
        </div>
        <h1 className="convo-name">{otherUserId}</h1>
      </header>

      {/* Messages area */}
      <section className="convo-messages">
        {loading ? (
          <p className="convo-status">Loading messages...</p>
        ) : messages.length === 0 ? (
          <p className="convo-status">No messages yet. Say hi! 👋</p>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === currentUser;
            return (
              <div key={msg.id} className={`bubble-row ${isMe ? 'bubble-row--me' : 'bubble-row--them'}`}>
                <div className={`bubble ${isMe ? 'bubble--me' : 'bubble--them'}`}>
                  <p className="bubble-text">{msg.content}</p>
                  <span className="bubble-time">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </section>

      {/* Input bar */}
      <footer className="convo-input-bar">
        <input
          type="text"
          className="convo-input"
          placeholder="Type a message..."
          value={newMsg}
          onChange={(e) => setNewMsg(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button className="convo-send" onClick={handleSend} aria-label="Send" disabled={!newMsg.trim()}>
          <Send size={20} />
        </button>
      </footer>
    </div>
  );
}
