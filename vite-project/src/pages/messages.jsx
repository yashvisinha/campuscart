import { useNavigate } from "react-router-dom";
import {
  Settings as SettingsIcon,
  Bell as BellIcon,
} from "lucide-react";
import "./messages.css";

const messages = [
  {
    id: 1,
    sender: "Hiba",
    preview: "Thank you for your order",
    time: "2m",
    unread: true,
  },
  {
    id: 2,
    sender: "CampusCart",
    preview: "Your pickup slot is confirmed",
    time: "18m",
    unread: false,
  },
  {
    id: 3,
    sender: "Sneha",
    preview: "Can you add snacks to the cart?",
    time: "1h",
    unread: false,
  },
  {
    id: 4,
    sender: "Delivery",
    preview: "Your parcel is arriving today",
    time: "3h",
    unread: false,
  },
  {
    id: 5,
    sender: "Store Support",
    preview: "We updated your refund status",
    time: "Yesterday",
    unread: false,
  },
];

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

      <button className="icon-btn" aria-label="notifications">
        <BellIcon size={28} />
      </button>
    </header>
  );
}

function MessageRow({ sender, preview, time, unread }) {
  return (
    <article className={`message-card${unread ? " message-card-unread" : ""}`}>
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

export default function Messages() {
  return (
    <>
      <Header />

      <section className="hero">
        <h1 className="hero-title">Messages</h1>
      </section>

      <section className="messages-list" aria-label="Recent messages">
        {messages.map((message) => (
          <MessageRow key={message.id} {...message} />
        ))}
      </section>
    </>
  );
}