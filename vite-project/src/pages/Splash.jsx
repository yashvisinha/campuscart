import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import logoImg from '../assets/newlogo.png';
import './Splash.css';

function Splash() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/onboarding');
    }, 4000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="splash-screen">
      <div className="splash-bg-glow-1" />
      <div className="splash-bg-glow-2" />

      <div className="splash-card">
        <div className="splash-card-glow" />

        <div className="splash-logo floating-element">
          <div className="splash-logo-box">
            <img src={logoImg} alt="Campus Cart" className="splash-logo-img" />
          </div>
        </div>

        <div className="splash-text">
          <h1 className="splash-title">Campus Cart</h1>
          <p className="splash-subtitle">Best Deals, Right Next Door.</p>
          <div className="splash-divider" />
          <p className="splash-description">
            The premium marketplace designed exclusively for students. Buy, sell, and connect instantly on campus.
          </p>
        </div>

        <button className="splash-cta" onClick={() => navigate('/onboarding')}>
          Get Started
          <ArrowRight size={20} />
        </button>

        <button className="splash-login-link" onClick={() => navigate('/login')}>
          Already have an account? Log In
        </button>
      </div>
    </div>
  );
}

export default Splash;