import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, BookOpen, Headphones, Shirt, ArrowRight, Compass, ShoppingBag, MessageCircle, User, Lock, ShieldCheck, CreditCard, MessageSquare, ShieldQuestion } from 'lucide-react';
import './Onboarding.css';

const slides = [
  {
    key: 'discover',
    heading: 'Find Your Campus Loot',
    description: 'Browse textbooks, electronics, and essentials from fellow students.',
    badgeIcon: <Compass size={28} />,
    buttonClass: 'onboarding-btn-pink',
    illustration: (
      <div className="ob-visual">
        <div className="ob-phone ob-phone--search">
          <div className="ob-search-bar">
            <Search size={16} />
            <div className="ob-search-line" />
          </div>
          <div className="ob-grid">
            <div className="ob-grid-item">
              <div className="ob-grid-icon ob-grid-icon--teal"><BookOpen size={18} /></div>
              <div className="ob-grid-line" />
              <div className="ob-grid-line ob-grid-line--pink short" />
            </div>
            <div className="ob-grid-item">
              <div className="ob-grid-icon ob-grid-icon--mint"><Headphones size={18} /></div>
              <div className="ob-grid-line" />
              <div className="ob-grid-line ob-grid-line--pink short" />
            </div>
            <div className="ob-grid-item">
              <div className="ob-grid-icon ob-grid-icon--teal"><Shirt size={18} /></div>
              <div className="ob-grid-line" />
              <div className="ob-grid-line ob-grid-line--pink short" />
            </div>
            <div className="ob-grid-item">
              <div className="ob-grid-icon ob-grid-icon--mint"><ShoppingBag size={18} /></div>
              <div className="ob-grid-line" />
              <div className="ob-grid-line ob-grid-line--pink short" />
            </div>
          </div>
        </div>
        <div className="ob-float ob-float--left ob-float-1">
          <div className="ob-float-icon ob-float-icon--pink">🏷️</div>
          <div className="ob-float-lines">
            <div className="ob-grid-line" />
            <div className="ob-grid-line ob-grid-line--pink short" />
          </div>
        </div>
        <div className="ob-float ob-float--right ob-float-2">
          <div className="ob-float-icon ob-float-icon--mint">🛒</div>
          <div className="ob-float-lines">
            <div className="ob-grid-line" />
            <div className="ob-grid-line ob-grid-line--mint short" />
          </div>
        </div>
      </div>
    ),
  },
  {
    key: 'shop-sell',
    heading: 'Shop and Sell Instantly',
    description: 'Connect with local buyers and sellers to discover safe transactions and great deals right on campus.',
    badgeIcon: <ShoppingBag size={28} />,
    buttonClass: 'onboarding-btn-teal',
    illustration: (
      <div className="ob-visual ob-visual--dual">
        <div className="ob-phone ob-phone--list">
          <div className="ob-notch" />
          <div className="ob-list-item">
            <div className="ob-list-icon"><BookOpen size={16} /></div>
            <div className="ob-list-text">
              <span className="ob-list-title">TEXTBOOK</span>
              <span className="ob-list-sub ob-list-sub--pink">-50% off</span>
            </div>
          </div>
          <div className="ob-list-item">
            <div className="ob-list-icon"><Shirt size={16} /></div>
            <div className="ob-list-text">
              <span className="ob-list-title">SHOES</span>
              <span className="ob-list-sub ob-list-sub--mint">- 1500 ₹</span>
            </div>
          </div>
          <div className="ob-list-item">
            <div className="ob-list-icon"><Shirt size={16} /></div>
            <div className="ob-list-text">
              <span className="ob-list-title">LAB UNIFORM</span>
              <span className="ob-list-sub ob-list-sub--mint">- 650 ₹</span>
            </div>
          </div>
        </div>

        <div className="ob-chat-bubbles">
          <div className="ob-chat-bubble ob-chat-bubble--mint"><MessageCircle size={16} /></div>
          <div className="ob-chat-bubble ob-chat-bubble--teal"><MessageSquare size={16} /></div>
        </div>

        <div className="ob-phone ob-phone--profile">
          <div className="ob-notch" />
          <div className="ob-avatar"><User size={32} /></div>
          <p className="ob-phone-caption">
            Connect with your community for <span className="ob-highlight">safe and easy</span> sales.
          </p>
        </div>
      </div>
    ),
  },
  {
    key: 'secure',
    heading: 'Secure & Trusted Deals',
    description: 'Verified sellers, secure payments, and private campus meetups giving you peace of mind.',
    badgeIcon: <ShieldQuestion size={28} />,
    buttonClass: 'onboarding-btn-pink',
    illustration: (
      <div className="ob-visual">
        <div className="ob-phone ob-phone--lock">
          <div className="ob-lock-circle"><Lock size={32} /></div>
          <div className="ob-lock-lines">
            <div className="ob-grid-line" />
            <div className="ob-grid-line short" />
          </div>
        </div>
        <div className="ob-float ob-float--left ob-float-1">
          <div className="ob-float-icon ob-float-icon--mint"><ShieldCheck size={18} /></div>
          <p className="ob-float-label">Verified<br />Users</p>
        </div>
        <div className="ob-float ob-float--top-right ob-float-2">
          <div className="ob-float-icon ob-float-icon--pink"><CreditCard size={18} /></div>
          <p className="ob-float-label">Secure<br />Payments</p>
        </div>
        <div className="ob-float ob-float--bottom-right ob-float-3">
          <div className="ob-float-icon ob-float-icon--red"><MessageSquare size={18} /></div>
          <p className="ob-float-label">Talk<br />Privately</p>
        </div>
      </div>
    ),
  },
];

function Onboarding() {
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const isLastSlide = current === slides.length - 1;
  const slide = slides[current];

  const handleLaunchDAuth = async () => {
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      const redirectUri = `${window.location.origin}/auth/callback`;
      const res = await fetch(
        `/api/auth/dauth/url?redirectUri=${encodeURIComponent(redirectUri)}`,
      );
      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('Failed to receive auth redirect URL.');
      }
    } catch (err) {
      console.error('Unable to start DAuth login:', err);
      setError(err.message || 'Could not start DAuth login.');
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (isLastSlide) {
      handleLaunchDAuth();
    } else {
      setCurrent(current + 1);
    }
  };

  return (
    <div className="onboarding-screen">
      <div className="ob-bg-glow" />

      <main className="onboarding-main">
        {slide.illustration}

        <div className="ob-text">
          <div className="ob-badge">{slide.badgeIcon}</div>
          <h1 className="ob-heading">{slide.heading}</h1>
          <p className="ob-description">{slide.description}</p>
        </div>
      </main>

      <div className="onboarding-bottom">
        <button
          className={`onboarding-next-btn ${slide.buttonClass}`}
          onClick={handleNext}
          disabled={loading}
        >
          {isLastSlide ? (loading ? 'Redirecting...' : 'Login') : 'Next'}
          <ArrowRight size={20} />
        </button>

        {error && (
          <div className="onboarding-error">{error}</div>
        )}

        <div className="onboarding-dots">
          {slides.map((s, i) => (
            <span key={s.key} className={`onboarding-dot ${i === current ? 'onboarding-dot--active' : ''}`} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default Onboarding;