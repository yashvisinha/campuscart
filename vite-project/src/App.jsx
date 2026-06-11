import React from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
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

// Bottom navigation component
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

function App() {
  return (
    <Router>
      <Routes>
        {/* Default page*/}
        <Route path="/" element={<PageLayout><HomePage /></PageLayout>} />
        
        {/* Home Page */}
        <Route path="/home" element={<PageLayout><HomePage /></PageLayout>} />
        
        {/* Settings Page */}
        <Route path="/settings" element={<SettingsPage />} />
        
        {/* Product Page */}
        <Route path="/product" element={<ProductPage />} />

        {/* You Page */}
        <Route path="/you" element={<PageLayout><YouPage /></PageLayout>} />

        {/*chat page*/}
        <Route path="/messages" element={<PageLayout><Messages /></PageLayout>} />
    
        {/*category page*/}
        <Route path="/category" element={<PageLayout><Category /></PageLayout>} />

        {/*post page*/}
        <Route path="/post" element={<PageLayout><PostPage /></PageLayout>} />
      
        {/* Login Page */}
        <Route path="/login" element={<LoginPage />} />      
      
      </Routes>
    </Router>
  );
}

export default App;
