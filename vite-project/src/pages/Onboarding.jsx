import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import slide1Img from '../assets/campuscart-slide1.png';
import slide2Img from '../assets/campuscart-slide2.png';
import slide3Img from '../assets/campuscart-slide3.png';
import './Onboarding.css';

const slides = [slide1Img, slide2Img, slide3Img];

function Onboarding() {
  const [current, setCurrent] = useState(0);
  const navigate = useNavigate();
  const isLastSlide = current === slides.length - 1;

  const handleNext = () => {
    if (isLastSlide) {
      navigate('/login');
    } else {
      setCurrent(current + 1);
    }
  };

  return (
    <div className="onboarding-screen">
      <img
        src={slides[current]}
        alt={`Onboarding slide ${current + 1}`}
        className="onboarding-image"
      />

      <button className="onboarding-next-btn" onClick={handleNext}>
        {isLastSlide ? 'Login' : 'Next'}
      </button>
    </div>
  );
}

export default Onboarding;