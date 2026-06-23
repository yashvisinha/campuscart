// Top bar (icon, search, profile)
// Hero section (title + carousel cards + dots)
// Category grid section (alternating tile heights)
// Bottom navigation bar
// App shell (full-height mobile viewport + spacing)

// Content area should scroll, top and bottom bars remain visually stable

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Settings as SettingsIcon,
  Bell as BellIcon,
} from "lucide-react";
import "./home.css";

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
function Categories({ categories }) {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(0);

  if (categories.length === 0) return null;

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
            {previousCategory?.name}
          </span>
        </div>
        <button 
          className="card card-center"
          type="button"
          onClick={() => navigate('/category', { state: { category: currentCategory } })}
          aria-label="View category"
        >
          <span className="card-label">{currentCategory?.name}</span>
        </button>
        <div className="card card-right" aria-hidden="true">
          <span className="card-label card-label-small">{nextCategory?.name}</span>
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
            key={category.id}
            className={index === activeIndex ? "dot dot-active" : "dot"}
            aria-hidden="true"
          />
        ))}
      </div>
    </section>
  );
}

function RandomElements({ products }) {
  const navigate = useNavigate();

  // If we don't have products yet, we can render empty tiles or a loading state
  if (!products || products.length === 0) return null;

  const renderTiles = (startIdx, endIdx, prefix) => {
    return products.slice(startIdx, endIdx).map((product, index) => (
      <button
        key={`${prefix}-${product.id}-${index}`}
        type="button"
        className="tile"
        style={{ 
          height: "170px",
          backgroundImage: `url(${product.image_url})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}
        onClick={() => navigate("/product", { state: { from: "/home", productId: product.id } })}
        aria-label={`Open ${product.name}`}
      >
        <div style={{
          position: 'absolute',
          bottom: 0, left: 0, right: 0,
          background: 'linear-gradient(transparent, rgba(0,0,0,0.75))',
          color: 'white',
          padding: '8px',
          fontSize: '11px',
          fontWeight: 600,
          textAlign: 'left',
          lineHeight: 1.4
        }}>
          {product.name}<br/>
          <span style={{ color: '#bffcff', fontWeight: 700 }}>₹{product.price}</span>
        </div>
      </button>
    ));
  };

  // Duplicate for marquee effect
  const firstHalf = products.slice(0, Math.ceil(products.length / 2));
  const secondHalf = products.slice(Math.ceil(products.length / 2));

  return (
    <section
      className="random-marquee"
      aria-label="Auto scrolling categories preview"
    >
      <div className="marquee-column marquee-up">
        <div className="marquee-track">
          {renderTiles(0, firstHalf.length, "left")}
          {renderTiles(0, firstHalf.length, "left-copy")}
        </div>
      </div>

      <div className="marquee-column marquee-down">
        <div className="marquee-track">
          {renderTiles(firstHalf.length, products.length, "right")}
          {renderTiles(firstHalf.length, products.length, "right-copy")}
        </div>
      </div>
    </section>
  );
}

//complete home page
export default function Home() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const catRes = await fetch('/api/categories');
        const catData = await catRes.json();
        if (catData && !catData.error) setCategories(catData);

        const prodRes = await fetch('/api/products');
        const prodData = await prodRes.json();
        if (prodData && !prodData.error) setProducts(prodData);
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };
    fetchData();
  }, []);

  return (
    <>
      <Header />
      <Categories categories={categories} />
      <RandomElements products={products} />
    </>
  );
}