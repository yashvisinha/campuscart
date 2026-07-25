import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Settings as SettingsIcon,
  Bell as BellIcon,
} from "lucide-react";
import { supabase } from "../supabaseClient";
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

     <button className="icon-btn" aria-label="notifications" onClick={() => navigate('/notifications')}>
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
  const [products, setProducts] = useState([]);
  const [debugMsg, setDebugMsg] = useState("Loading...");

  useEffect(() => {
    async function fetchProducts() {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, price, image_url")
        .limit(8);

      if (error) {
        setDebugMsg("ERROR: " + JSON.stringify(error));
      } else if (!data || data.length === 0) {
        setDebugMsg("Fetch worked but returned 0 products.");
        setProducts([]);
      } else {
        setDebugMsg("Success: " + data.length + " products loaded.");
        setProducts(data);
      }
    }
    fetchProducts();
  }, []);

  function renderTiles(items, prefix) {
    return items.map((product, index) => (
      <button
        key={`${prefix}-${product.id}-${index}`}
        type="button"
        className="tile"
        style={{
          height: "170px",
          backgroundImage: product.image_url ? `url(${product.image_url})` : "none",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
        onClick={() => navigate(`/product/${product.id}`, { state: { from: "/home" } })}
        aria-label={product.name || "Open product preview"}
      />
    ));
  }

  return (
    <section
      className="random-marquee"
      aria-label="Auto scrolling categories preview"
    >
      {/* TEMP DEBUG LINE — remove after fixing */}
      <p style={{ color: "red", fontSize: "13px", padding: "8px" }}>
        DEBUG: {debugMsg}
      </p>

      <div className="marquee-column marquee-up">
        <div className="marquee-track">
          {renderTiles(products, "left")}
          {renderTiles(products, "left-copy")}
        </div>
      </div>

      <div className="marquee-column marquee-down">
        <div className="marquee-track">
          {renderTiles(products, "right")}
          {renderTiles(products, "right-copy")}
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