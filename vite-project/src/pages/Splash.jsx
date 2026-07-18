import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import splashImg from '../assets/splash.png';
import './Splash.css';

function Splash() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/onboarding');
    }, 4000); // 4 seconds

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="splash-screen">
      <img src={splashImg} alt="Campus Cart" className="splash-image" />
    </div>
  );
}

export default Splash;