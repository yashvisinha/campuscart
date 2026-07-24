import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Settings as SettingsIcon,
  Bell as BellIcon,
} from 'lucide-react';
import './home.css';
import './YouPage.css';

const Section = ({ title, items = [] }) => {
  const navigate = useNavigate();

  return (
    <section className="you-section">
      <div className="you-section-header">
        <h2>{title}</h2>
        <span className="you-section-subtitle">View all</span>
      </div>

      <div className="you-cards-row" aria-label={title}>
        {items && items.length > 0 ? (
          items.map((product) => (
            <button
              key={product.id}
              type="button"
              className="you-card"
              style={{ backgroundImage: product.image_url ? `url(${product.image_url})` : undefined }}
              aria-label={product.name}
              onClick={() => navigate(`/product/${product.id}`)}
            />
          ))
        ) : (
          Array.from({ length: 4 }).map((_, index) => (
            <button
              key={index}
              type="button"
              className="you-card"
              aria-label={`${title} item ${index + 1}`}
              onClick={() => navigate('/product', { state: { from: '/you' } })}
            />
          ))
        )}
      </div>
    </section>
  );
};

export default function YouPage() {
  const navigate = useNavigate();
  const [inventory, setInventory] = useState([]);

  useEffect(() => {
    const loadInventory = async () => {
      try {
        // TODO: replace with actual logged-in user id when auth is wired
        const userId = '106125040';
        const res = await fetch(`/api/users/${userId}/products`);
        if (!res.ok) return;
        const data = await res.json();
        setInventory(data || []);
      } catch (err) {
        console.error('Failed to load inventory', err);
      }
    };

    loadInventory();
  }, []);

  return (
    <>
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

      <div className="you-body">
        <h1 className="you-page-title">Your page</h1>

        <Section title="Your Inventory" items={inventory} />
        <Section title="Your Sales" />
        <Section title="Your Purchases" />
      </div>
    </>
  );
}
