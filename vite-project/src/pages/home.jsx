// Top bar (icon, search, profile)
// Hero section (title + carousel cards + dots)
// Category grid section (alternating tile heights)
// Bottom navigation bar
// App shell (full-height mobile viewport + spacing)

// Content area should scroll, top and bottom bars remain visually stable

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Settings as SettingsIcon,
  Bell as BellIcon,
} from "lucide-react";
import "./home.css";

//temporary array
const categories = [
  "Clothes",
  "Snacks",
  "Accessories",
  "Fresher's items",
  "College Essentials",
];

//header component
function Header() {
  const navigate = useNavigate();

  return (
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
  );
}

//categories + carousel
function Categories() {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(0);

  const previousCategory =
    categories[(activeIndex - 1 + categories.length) % categories.length];
  const currentCategory = categories[activeIndex];
  const nextCategory = categories[(activeIndex + 1) % categories.length];

  function goToPrevious() {
    setActiveIndex(
      (currentIndex) =>
        (currentIndex - 1 + categories.length) % categories.length,
    );
  }

  function goToNext() {
    setActiveIndex((currentIndex) => (currentIndex + 1) % categories.length);
  }

  return (
    <section className="hero">
      <h1 className="hero-title">Categories</h1>
      <div className="carousel">
        <button
          className="arrow left"
          type="button"
          onClick={goToPrevious}
          aria-label="previous category"
        >
          ‹
        </button>

        <div className="card card-left" aria-hidden="true">
          <span className="card-label card-label-small">
            {previousCategory}
          </span>
        </div>
        <button 
          className="card card-center"
          type="button"
          onClick={() => navigate('/category')}
          aria-label="View category"
        >
          <span className="card-label">{currentCategory}</span>
        </button>
        <div className="card card-right" aria-hidden="true">
          <span className="card-label card-label-small">{nextCategory}</span>
        </div>

        <button
          className="arrow right"
          type="button"
          onClick={goToNext}
          aria-label="next category"
        >
          ›
        </button>
      </div>

      {/* dots component */}
      <div className="dots">
        {categories.map((category, index) => (
          <span
            key={category}
            className={index === activeIndex ? "dot dot-active" : "dot"}
            aria-hidden="true"
          />
        ))}
      </div>
    </section>
  );
}

function RandomElements() {
  const navigate = useNavigate();
  const tileCount = 4;

  function renderTiles(count, prefix) {
    return Array.from({ length: count }, (_, index) => (
      <button
        key={`${prefix}-${index}`}
        type="button"
        className="tile"
        style={{ height: "170px" }}
        onClick={() => navigate("/product", { state: { from: "/home" } })}
        aria-label="Open product preview"
      />
    ));
  }

  return (
    <section
      className="random-marquee"
      aria-label="Auto scrolling categories preview"
    >
      <div className="marquee-column marquee-up">
        <div className="marquee-track">
          {renderTiles(tileCount, "left")}
          {renderTiles(tileCount, "left-copy")}
        </div>
      </div>

      <div className="marquee-column marquee-down">
        <div className="marquee-track">
          {renderTiles(tileCount, "right")}
          {renderTiles(tileCount, "right-copy")}
        </div>
      </div>
    </section>
  );
}

//complete home page
export default function Home() {
  return (
    <>
      <Header />
      <Categories />
      <RandomElements />
    </>
  );
}