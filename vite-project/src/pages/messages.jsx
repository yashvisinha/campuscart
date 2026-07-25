import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Settings as SettingsIcon,
  Bell as BellIcon,
} from "lucide-react";
import { supabase } from "../supabaseClient";
import "./messages.css";

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

function MessageRow({ sender, preview, time }) {
  return (
    <article className="message-card">
      <div className="message-avatar" aria-hidden="true">
        {sender
          .split(" ")
          .map((word) => word[0])
          .slice(0, 2)
          .join("")}
      </div>

      <div className="message-body">
        <div className="message-topline">
          <h2>{sender}</h2>
          <span>{time}</span>
        </div>
        <p>{preview}</p>
      </div>
    </article>
  );
}

function timeAgo(dateString) {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "Yesterday" : `${days}d`;
}

export default function Messages() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMessages() {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("messages")
        .select("id, sender_id, receiver_id, content, created_at")
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching messages:", error);
        setLoading(false);
        return;
      }

      // Group by the "other person" in the conversation, keep only latest message per person
      const seen = new Map();
      for (const msg of data) {
        const otherId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
        if (!seen.has(otherId)) {
          seen.set(otherId, msg);
        }
      }

      // Look up display names for each "other person" from profiles
      const otherIds = Array.from(seen.keys());
      let namesMap = {};
      if (otherIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", otherIds);
        if (profilesData) {
          namesMap = Object.fromEntries(profilesData.map(p => [p.id, p.full_name]));
        }
      }

      const list = Array.from(seen.entries()).map(([otherId, msg]) => ({
        id: msg.id,
        sender: namesMap[otherId] || "Unknown user",
        preview: msg.content,
        time: timeAgo(msg.created_at),
      }));

      setConversations(list);
      setLoading(false);
    }

    loadMessages();
  }, []);

  return (
    <>
      <Header />

      <section className="hero">
        <h1 className="hero-title">Messages</h1>
      </section>

      <section className="messages-list" aria-label="Recent messages">
        {loading && <p style={{ textAlign: "center", opacity: 0.7 }}>Loading...</p>}
        {!loading && conversations.length === 0 && (
          <p style={{ textAlign: "center", opacity: 0.7 }}>No messages yet.</p>
        )}
        {conversations.map((message) => (
          <MessageRow key={message.id} {...message} />
        ))}
      </section>
    </>
  );
}