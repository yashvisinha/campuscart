import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, ShoppingBag, CheckCircle, XCircle } from 'lucide-react';
import { getUserId } from '../auth';
import { API_BASE } from '../config.js';
import './NotificationsPage.css';

function formatTime(timestamp) {
  if (!timestamp) return '';
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay === 1) return 'Yesterday';
  return `${diffDay}d ago`;
}

export default function NotificationsPage() {
  const navigate = useNavigate();
  const userId = getUserId();

  const [activeTab, setActiveTab] = useState('notifications'); // 'notifications' | 'deals'
  const [notifications, setNotifications] = useState([]);
  const [deals, setDeals] = useState([]);
  const [userProfiles, setUserProfiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});

  const fetchData = async () => {
    if (!userId) return;
    setLoading(true);

    try {
      const [notifRes, dealsRes] = await Promise.all([
        fetch(`${API_BASE}/api/notifications/${userId}`),
        fetch(`${API_BASE}/api/orders/user/${userId}`),
      ]);

      const notifData = await notifRes.json();
      const dealsData = await dealsRes.json();

      if (Array.isArray(notifData)) setNotifications(notifData);
      if (Array.isArray(dealsData)) setDeals(dealsData);

      // Collect all unique user IDs to resolve display names
      const rollNos = new Set();
      if (Array.isArray(notifData)) {
        notifData.forEach((n) => {
          if (n.extra_data?.buyer_id) rollNos.add(String(n.extra_data.buyer_id));
          if (n.extra_data?.seller_id) rollNos.add(String(n.extra_data.seller_id));
        });
      }
      if (Array.isArray(dealsData)) {
        dealsData.forEach((d) => {
          if (d.buyer_id) rollNos.add(String(d.buyer_id));
          if (d.seller_id) rollNos.add(String(d.seller_id));
        });
      }

      const profilesMap = {};
      await Promise.all(
        Array.from(rollNos).map(async (rollNo) => {
          try {
            const res = await fetch(`${API_BASE}/api/profiles/by-roll/${rollNo}`);
            const pData = await res.json();
            if (pData && pData.full_name) {
              profilesMap[rollNo] = pData.full_name;
            }
          } catch (e) {
            // ignore
          }
        })
      );
      setUserProfiles(profilesMap);
    } catch (err) {
      console.error('Error fetching notifications/deals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userId) {
      navigate('/login');
      return;
    }
    fetchData();
  }, [userId, navigate]);

  const getUserName = (rollNo) => {
    if (!rollNo) return 'User';
    const str = String(rollNo);
    if (userProfiles[str]) return userProfiles[str];
    return str.match(/^\d+$/) ? `Student ${str}` : str;
  };

  const handleOrderAction = async (orderId, newStatus) => {
    setActionLoading((prev) => ({ ...prev, [orderId]: true }));

    try {
      const res = await fetch(`${API_BASE}/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        await fetchData();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update order status');
      }
    } catch (err) {
      console.error('Failed to update order:', err);
    } finally {
      setActionLoading((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  const unreadCount = notifications.filter((n) => n.status === 'unread').length;

  return (
    <>
      {/* Top Bar */}
      <header className="notif-topbar">
        <button className="notif-back" onClick={() => navigate(-1)} aria-label="Go back">
          <ArrowLeft size={22} />
        </button>
        <h1 className="notif-title">Notifications</h1>
        {unreadCount > 0 && <span className="notif-count">{unreadCount} new</span>}
      </header>

      {/* Tabs */}
      <nav className="notif-tabs">
        <button
          className={`notif-tab ${activeTab === 'notifications' ? 'notif-tab--active' : ''}`}
          onClick={() => setActiveTab('notifications')}
        >
          Notifications ({notifications.length})
        </button>
        <button
          className={`notif-tab ${activeTab === 'deals' ? 'notif-tab--active' : ''}`}
          onClick={() => setActiveTab('deals')}
        >
          Deals & Orders ({deals.length})
        </button>
      </nav>

      {/* Content */}
      <section className="notif-list">
        {loading ? (
          <p style={{ color: '#aaa', textAlign: 'center', padding: '40px 0' }}>Loading...</p>
        ) : activeTab === 'notifications' ? (
          notifications.length === 0 ? (
            <p style={{ color: '#aaa', textAlign: 'center', padding: '40px 0' }}>
              No notifications yet.
            </p>
          ) : (
            notifications.map((n) => {
              const productName = n.products?.name || n.extra_data?.product_name || 'Product';
              const buyerId = n.extra_data?.buyer_id;
              const sellerId = n.extra_data?.seller_id;
              const isPurchaseReq = n.type === 'purchase_request';

              let title = 'Notification';
              let body = '';

              if (n.type === 'purchase_request') {
                title = `🛒 Purchase request for "${productName}"`;
                body = `${getUserName(buyerId)} wants to buy your product.`;
              } else if (n.type === 'purchase_accepted') {
                title = `🎉 Purchase accepted for "${productName}"!`;
                body = `${getUserName(sellerId)} accepted your offer. Arrange pickup via chat!`;
              } else if (n.type === 'purchase_declined') {
                title = `❌ Purchase declined for "${productName}"`;
                body = `${getUserName(sellerId)} declined your purchase request.`;
              } else {
                title = productName;
                body = n.extra_data?.message || 'New update on your account.';
              }

              return (
                <article
                  key={n.id}
                  className={`notif-item ${n.status === 'unread' ? 'notif-item--unread' : ''}`}
                >
                  <div className="notif-item-header">
                    <div className="notif-icon-wrap">
                      <Bell size={20} />
                    </div>
                    <div className="notif-body">
                      <p className="notif-item-title">{title}</p>
                      <p className="notif-item-body">{body}</p>
                      <span className="notif-time">{formatTime(n.created_at)}</span>
                    </div>
                  </div>

                  {/* Accept / Decline actions for pending purchase requests */}
                  {isPurchaseReq && n.related_order_id && (
                    <div className="notif-actions">
                      <button
                        className="notif-btn-accept"
                        onClick={() => handleOrderAction(n.related_order_id, 'accepted')}
                        disabled={actionLoading[n.related_order_id]}
                      >
                        Accept
                      </button>
                      <button
                        className="notif-btn-decline"
                        onClick={() => handleOrderAction(n.related_order_id, 'declined')}
                        disabled={actionLoading[n.related_order_id]}
                      >
                        Decline
                      </button>
                    </div>
                  )}
                </article>
              );
            })
          )
        ) : (
          /* Deals Tab */
          deals.length === 0 ? (
            <p style={{ color: '#aaa', textAlign: 'center', padding: '40px 0' }}>
              No deals or order history yet.
            </p>
          ) : (
            deals.map((order) => {
              const productName = order.products?.name || 'Product';
              const isBuyer = String(order.buyer_id) === String(userId);
              const otherUserLabel = isBuyer
                ? `Seller: ${getUserName(order.seller_id)}`
                : `Buyer: ${getUserName(order.buyer_id)}`;

              return (
                <article key={order.id} className="notif-item">
                  <div className="notif-item-header">
                    <div className="notif-icon-wrap">
                      <ShoppingBag size={20} />
                    </div>
                    <div className="notif-body">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <p className="notif-item-title">{productName}</p>
                        <span className={`deal-status-pill deal-status-pill--${order.status}`}>
                          {order.status}
                        </span>
                      </div>
                      <p className="notif-item-body">
                        {isBuyer ? 'Your purchase offer' : 'Offer received'} • {otherUserLabel}
                      </p>
                      <span className="notif-time">{formatTime(order.created_at)}</span>
                    </div>
                  </div>

                  {/* If seller and order is pending, allow action here too */}
                  {!isBuyer && order.status === 'pending' && (
                    <div className="notif-actions">
                      <button
                        className="notif-btn-accept"
                        onClick={() => handleOrderAction(order.id, 'accepted')}
                        disabled={actionLoading[order.id]}
                      >
                        Accept Deal
                      </button>
                      <button
                        className="notif-btn-decline"
                        onClick={() => handleOrderAction(order.id, 'declined')}
                        disabled={actionLoading[order.id]}
                      >
                        Decline Deal
                      </button>
                    </div>
                  )}
                </article>
              );
            })
          )
        )}
      </section>
    </>
  );
}
