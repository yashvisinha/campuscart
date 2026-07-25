import React from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { isAuthenticated } from './auth';
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

// Bottom navigation component
function BottomNav() {
  const navigate = useNavigate();

  return (
    <nav className="bottom-nav">
      <button className="nav-icon" onClick={() => navigate('/home')} aria-label="Home"><HomeIcon /></button>
      <button className="nav-icon" onClick={() => navigate('/wishlist')} aria-label="Wishlist"><ShoppingCartIcon /></button>
      <button className="nav-icon" onClick={() => navigate('/post')} aria-label="Plus"><PlusIcon /></button>
      <button className="nav-icon" onClick={() => navigate('/messages')} aria-label="Messages"><MessageCircleIcon /></button>
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
      <BottomNav />
    </main>
  );
}

function ProtectedRoute({ children }) {
  return isAuthenticated() ? children : <Navigate to="/login" replace />;
}

function App() {
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