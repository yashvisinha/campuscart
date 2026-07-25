import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { supabase } from "../supabaseClient";
import "./messages.css";

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

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadNotifications() {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("recipient_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching notifications:", error);
      } else {
        setNotifications(data);
        // Mark all as read
        const unreadIds = data.filter(n => !n.is_read).map(n => n.id);
        if (unreadIds.length > 0) {
          await supabase
            .from("notifications")
            .update({ is_read: true })
            .in("id", unreadIds);
        }
      }
      setLoading(false);
    }
    loadNotifications();
  }, []);

  return (
    <>
      <header className="topbar">
        <button className="icon-btn" aria-label="back" onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <h1 style={{ margin: 0 }}>Notifications</h1>
        <div style={{ width: 28 }} />
      </header>

      <section className="messages-list" aria-label="Notifications">
        {loading && <p style={{ textAlign: "center", opacity: 0.7 }}>Loading...</p>}
        {!loading && notifications.length === 0 && (
          <p style={{ textAlign: "center", opacity: 0.7 }}>No notifications yet.</p>
        )}
        {notifications.map((n) => (
          <article
            key={n.id}
            className="message-card"
            style={{ opacity: n.is_read ? 0.7 : 1 }}
          >
            <div className="message-body">
              <div className="message-topline">
                <h2 style={{ fontSize: "14px" }}>{n.content}</h2>
                <span>{timeAgo(n.created_at)}</span>
              </div>
            </div>
          </article>
        ))}
      </section>
    </>
  );
}