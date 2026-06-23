import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Tag, ShoppingBag, Bell, Package, MessageCircle } from 'lucide-react';
import './NotificationsPage.css';

const NOTIFICATIONS = [
  {
    id: 1,
    type: 'deal',
    icon: Tag,
    title: '🔥 Flash Sale — 30% off Clothes!',
    body: 'Grab campus tees and hoodies at 30% off. Today only!',
    time: '2 min ago',
    unread: true,
  },
  {
    id: 2,
    type: 'deal',
    icon: ShoppingBag,
    title: 'New arrivals in College Essentials',
    body: 'Study lamps, notebooks and more just dropped. Check them out.',
    time: '1 hr ago',
    unread: true,
  },
  {
    id: 3,
    type: 'stock',
    icon: Package,
    title: 'Back in stock: Backpack',
    body: 'The water-resistant laptop backpack you liked is back in stock. Only 30 left!',
    time: '3 hr ago',
    unread: false,
  },
  {
    id: 4,
    type: 'message',
    icon: MessageCircle,
    title: 'New message from Rohan',
    body: '"Hey, is the Snack pack still available?"',
    time: 'Yesterday',
    unread: false,
  },
  {
    id: 5,
    type: 'stock',
    icon: Package,
    title: '⚠️ Running low: Instant Noodles',
    body: 'Only 5 packs left. Restock soon to avoid missing out.',
    time: 'Yesterday',
    unread: false,
  },
  {
    id: 6,
    type: 'deal',
    icon: Tag,
    title: 'Fresher\'s Week Special: 20% off accessories',
    body: 'Use code FRESH20 at checkout. Valid till Sunday.',
    time: '2 days ago',
    unread: false,
  },
];

const TYPE_COLORS = {
  deal: { bg: 'rgba(191,252,255,0.12)', border: 'rgba(191,252,255,0.25)', icon: '#bffcff' },
  stock: { bg: 'rgba(255,165,0,0.1)', border: 'rgba(255,165,0,0.25)', icon: '#ffa500' },
  message: { bg: 'rgba(130,100,255,0.12)', border: 'rgba(130,100,255,0.3)', icon: '#a080ff' },
};

export default function NotificationsPage() {
  const navigate = useNavigate();
  const unreadCount = NOTIFICATIONS.filter((n) => n.unread).length;

  return (
    <>
      {/* Top Bar */}
      <header className="notif-topbar">
        <button className="notif-back" onClick={() => navigate(-1)} aria-label="Go back">
          <ArrowLeft size={22} />
        </button>
        <h1 className="notif-title">Notifications</h1>
        {unreadCount > 0 && (
          <span className="notif-count">{unreadCount} new</span>
        )}
      </header>

      {/* List */}
      <section className="notif-list">
        {NOTIFICATIONS.map((n) => {
          const colors = TYPE_COLORS[n.type];
          const Icon = n.icon;
          return (
            <article
              key={n.id}
              className={`notif-item ${n.unread ? 'notif-item--unread' : ''}`}
              style={{ '--card-bg': colors.bg, '--card-border': colors.border }}
            >
              <div className="notif-icon-wrap" style={{ color: colors.icon }}>
                <Icon size={20} />
              </div>
              <div className="notif-body">
                <p className="notif-item-title">{n.title}</p>
                <p className="notif-item-body">{n.body}</p>
                <span className="notif-time">{n.time}</span>
              </div>
              {n.unread && <span className="notif-dot" aria-label="Unread" />}
            </article>
          );
        })}
      </section>
    </>
  );
}
