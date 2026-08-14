import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { isAuthenticated, getUserId, getUser } from './auth';
import { API_BASE } from './config.js';
import {
  Home as HomeIcon,
  ShoppingCart as ShoppingCartIcon,
  Plus as PlusIcon,
  User as UserIcon,
  MessageCircle as MessageCircleIcon,
} from 'lucide-react';

import LoginPage from './pages/login';
import SettingsPage from './pages/SettingsPage';
import ProductPage from './pages/ProductPage';
import YouPage from './pages/YouPage';
import HomePage from './pages/home';
import Messages from './pages/messages';
import Category from './pages/category';
import PostPage from './pages/post';
import Splash from './pages/Splash';
import Onboarding from './pages/Onboarding';
import AuthCallback from './pages/AuthCallback';
import WishlistPage from './pages/WishlistPage';
import NotificationsPage from './pages/NotificationsPage';
import ConversationPage from './pages/ConversationPage';
import { WishlistProvider } from './context/WishlistContext';
import NotificationOptInPrompt from './components/NotificationOptInPrompt';
import { showLocalPushNotification } from './utils/pushNotifications.js';

// Bottom navigation component
function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const [hasUnreadMsg, setHasUnreadMsg] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const prevUnreadRef = React.useRef(0);
  const userId = getUserId();

  useEffect(() => {
    if (!userId) return;

    const checkUnread = () => {
      fetch(`${API_BASE}/api/messages/chats/${userId}`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            const totalUnread = data.reduce(
              (acc, c) => acc + (c.unreadCount || (c.unread ? 1 : 0)),
              0
            );
            if (totalUnread > prevUnreadRef.current) {
              const latestChat = data.find((c) => c.unread);
              showLocalPushNotification(
                latestChat ? `New message from ${latestChat.displayName || latestChat.userId}` : 'New message received! 💬',
                {
                  body: latestChat?.lastMessage || 'You have new unread messages.',
                  url: latestChat ? `/conversation/${latestChat.userId}` : '/messages',
                  tag: 'unread-message',
                }
              );
            }
            prevUnreadRef.current = totalUnread;
            setUnreadCount(totalUnread);
            setHasUnreadMsg(totalUnread > 0);
          }
        })
        .catch(() => {});
    };

    checkUnread();
    const interval = setInterval(checkUnread, 3000);
    window.addEventListener('unread-messages-updated', checkUnread);

    return () => {
      clearInterval(interval);
      window.removeEventListener('unread-messages-updated', checkUnread);
    };
  }, [userId, location.pathname]);

  return (
    <nav className="bottom-nav">
      <button className="nav-icon" onClick={() => navigate('/home')} aria-label="Home"><HomeIcon /></button>
      <button className="nav-icon" onClick={() => navigate('/wishlist')} aria-label="Wishlist"><ShoppingCartIcon /></button>
      <button className="nav-icon" onClick={() => navigate('/post')} aria-label="Plus"><PlusIcon /></button>
      <button className="nav-icon" onClick={() => navigate('/messages')} aria-label="Messages" style={{ position: 'relative' }}>
        <MessageCircleIcon />
        {hasUnreadMsg && (
          <span
            className="unread-indicator"
            style={{
              position: 'absolute',
              top: 2,
              right: unreadCount > 0 ? -2 : 4,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              background: '#ff686b',
              color: '#ffffff',
              borderRadius: '10px',
              padding: unreadCount > 0 ? '1px 5px' : '0',
              minWidth: unreadCount > 0 ? '16px' : '8px',
              height: unreadCount > 0 ? '16px' : '8px',
              fontSize: '10px',
              fontWeight: '700',
              lineHeight: 1,
              border: '2px solid #e9d1bc',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            }}
          >
            {unreadCount > 0 ? (unreadCount > 99 ? '99+' : unreadCount) : null}
          </span>
        )}
      </button>
      <button className="nav-icon" onClick={() => navigate('/you')} aria-label="Profile"><UserIcon /></button>
    </nav>
  );
}

// Layout wrapper for pages with bottom nav
function PageLayout({ children }) {
  return (
    <main className="app-shell">
      <section className="app-content">
        {children}
      </section>
      <NotificationOptInPrompt />
      <BottomNav />
    </main>
  );
}

function ProtectedRoute({ children }) {
  return isAuthenticated() ? children : <Navigate to="/login" replace />;
}

function App() {
  useEffect(() => {
    const user = getUser();
    const userId = getUserId();
    if (!userId) return;

    const hostel = localStorage.getItem('dauth_user_hostel') || '';
    const room = localStorage.getItem('dauth_user_room') || '';
    const pfp = localStorage.getItem('dauth_user_pfp') || null;

    fetch(`${API_BASE}/api/profiles/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roll_no: userId,
        full_name: user?.name || undefined,
        email: user?.email || undefined,
        hostel,
        room_number: room,
        profile_pic_url: pfp,
      }),
    }).catch(() => {});
  }, []);
  return (
    <WishlistProvider>
      <Router>
        <Routes>
          {/* Default page - Splash screen */}
          <Route path="/" element={<Splash />} />

          {/* Onboarding Page */}
          <Route path="/onboarding" element={<Onboarding />} />

          {/* Login Page */}
          <Route path="/login" element={<LoginPage />} />
          
          {/* Auth Callback Page */}
          <Route path="/auth/callback" element={<AuthCallback />} />

          {/* Home Page */}
          <Route path="/home" element={<ProtectedRoute><PageLayout><HomePage /></PageLayout></ProtectedRoute>} />
          
          {/* Settings Page */}
          <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          
          {/* Product Page */}
          <Route path="/product" element={<ProtectedRoute><PageLayout><ProductPage /></PageLayout></ProtectedRoute>} />

          {/* You Page */}
          <Route path="/you" element={<ProtectedRoute><PageLayout><YouPage /></PageLayout></ProtectedRoute>} />

          {/*chat page*/}
          <Route path="/messages" element={<ProtectedRoute><PageLayout><Messages /></PageLayout></ProtectedRoute>} />
      
          {/*category page*/}
          <Route path="/category" element={<ProtectedRoute><PageLayout><Category /></PageLayout></ProtectedRoute>} />

          {/*post page*/}
          <Route path="/post" element={<ProtectedRoute><PageLayout><PostPage /></PageLayout></ProtectedRoute>} />

          {/*wishlist page*/}
          <Route path="/wishlist" element={<ProtectedRoute><PageLayout><WishlistPage /></PageLayout></ProtectedRoute>} />

          {/*notifications page*/}
          <Route path="/notifications" element={<ProtectedRoute><PageLayout><NotificationsPage /></PageLayout></ProtectedRoute>} />

          {/*conversation page*/}
          <Route path="/conversation/:otherUserId" element={<ProtectedRoute><PageLayout><ConversationPage /></PageLayout></ProtectedRoute>} />
        </Routes>
      </Router>
    </WishlistProvider>
  );
}

export default App;