import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Settings as SettingsIcon,
  Bell as BellIcon,
} from 'lucide-react';
import './home.css';
import './YouPage.css';

const Section = ({ title }) => {
  const navigate = useNavigate();

  return (
    <section className="you-section">
      <div className="you-section-header">
        <h2>{title}</h2>
        <span className="you-section-subtitle">View all</span>
      </div>

      <div className="you-cards-row" aria-label={title}>
        {Array.from({ length: 4 }).map((_, index) => (
          <button
            key={index}
            type="button"
            className="you-card"
            aria-label={`${title} item ${index + 1}`}
            onClick={() => navigate('/product', { state: { from: '/you' } })}
          />
        ))}
      </div>
    </section>
  );
};

export default function YouPage() {
  const navigate = useNavigate();

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

        <Section title="Your Inventory" />
        <Section title="Your Sales" />
        <Section title="Your Purchases" />
      </div>
    </>
  );
}
