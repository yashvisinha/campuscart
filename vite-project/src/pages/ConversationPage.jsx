import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';
import { getUserId } from '../auth';
import './ConversationPage.css';

export default function ConversationPage() {
  const { otherUserId } = useParams();
  const navigate = useNavigate();
  const currentUser = getUserId();

  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    fetch(`/api/messages/conversation/${currentUser}/${otherUserId}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setMessages(data);
        setLoading(false);

        // Mark this conversation's messages as read
        fetch(`/api/messages/read/${otherUserId}/${currentUser}`, { method: 'PUT' })
          .catch(err => console.error('Failed to mark as read:', err));
      })
      .catch(err => {
        console.error('Error fetching conversation:', err);
        setLoading(false);
      });
  }, [currentUser, otherUserId, navigate]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const text = newMsg.trim();
    if (!text || !currentUser) return;

    const optimisticMsg = {
      id: Date.now(),
      sender_id: currentUser,
      receiver_id: otherUserId,
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimisticMsg]);
    setNewMsg('');

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

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="convo-container" style={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'column' }}>
      <header className="convo-topbar">
        <button className="convo-back" onClick={() => navigate('/messages')} aria-label="Back">
          <ArrowLeft size={22} />
        </button>
        <div className="convo-avatar">
          {String(otherUserId).split(' ').map(w => w[0]?.toUpperCase()).slice(0, 2).join('')}
        </div>
        <h1 className="convo-name">{otherUserId}</h1>
      </header>

      <section className="convo-messages">
        {loading ? (
          <p className="convo-status">Loading messages...</p>
        ) : messages.length === 0 ? (
          <p className="convo-status">No messages yet. Say hi! 👋</p>
        ) : (
          messages.map((msg) => {
            const isMe = String(msg.sender_id) === String(currentUser);
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