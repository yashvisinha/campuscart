import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import {
  Home as HomeIcon,
  ShoppingCart as ShoppingCartIcon,
  Plus as PlusIcon,
  User as UserIcon,
  MessageCircle as MessageCircleIcon,
} from 'lucide-react';
import { supabase } from './supabaseClient';

import LoginPage from './pages/login';
import SettingsPage from './pages/SettingsPage';
import ProductPage from './pages/ProductPage';
import YouPage from './pages/YouPage';
import HomePage from './pages/home';
import Messages from './pages/messages';
import Category from './pages/category';
import PostPage from './pages/post';
import NotificationsPage from './pages/NotificationsPage';

function BottomNav() {
  const navigate = useNavigate();
  return (
    <nav className="bottom-nav">
      <button className="nav-icon" onClick={() => navigate('/home')} aria-label="Home"><HomeIcon /></button>
      <button className="nav-icon" onClick={() => { }} aria-label="Cart"><ShoppingCartIcon /></button>
      <button className="nav-icon" onClick={() => navigate('/post')} aria-label="Plus"><PlusIcon /></button>
      <button className="nav-icon" onClick={() => navigate('/messages')} aria-label="Messages"><MessageCircleIcon /></button>
      <button className="nav-icon" onClick={() => navigate('/you')} aria-label="Profile"><UserIcon /></button>
    </nav>
  );
}

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

function RequireAuth({ children }) {
  const [session, setSession] = useState(undefined);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (!data.session) navigate('/login');
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) navigate('/login');
    });

    return () => listener.subscription.unsubscribe();
  }, [navigate]);

  if (session === undefined) return <div style={{ padding: 20 }}>Checking login...</div>;
  if (!session) return null;

  return children;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<RequireAuth><PageLayout><HomePage /></PageLayout></RequireAuth>} />
        <Route path="/home" element={<RequireAuth><PageLayout><HomePage /></PageLayout></RequireAuth>} />
        <Route path="/settings" element={<RequireAuth><SettingsPage /></RequireAuth>} />
        <Route path="/product/:id" element={<RequireAuth><ProductPage /></RequireAuth>} />
        <Route path="/you" element={<RequireAuth><PageLayout><YouPage /></PageLayout></RequireAuth>} />
        <Route path="/messages" element={<RequireAuth><PageLayout><Messages /></PageLayout></RequireAuth>} />
        <Route path="/category" element={<RequireAuth><PageLayout><Category /></PageLayout></RequireAuth>} />
        <Route path="/post" element={<RequireAuth><PageLayout><PostPage /></PageLayout></RequireAuth>} />
        <Route path="/notifications" element={<RequireAuth><PageLayout><NotificationsPage /></PageLayout></RequireAuth>} />
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    </Router>
  );
}

export default App;