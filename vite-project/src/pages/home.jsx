import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Settings as SettingsIcon,
  Bell as BellIcon,
  X as ClearIcon,
} from "lucide-react";
import { getUserId } from "../auth";
import "./home.css";

import fresherKitsImg from '../assets/fresherskit.png';
import collegeEssentialsImg from '../assets/collegeessentials.png';
import othersImg from '../assets/others.png';
import snacksImg from '../assets/snacks.png';
import clothesImg from '../assets/cloths.png';
import accessoriesImg from '../assets/accesories.png';

const categoryImageMap = {
  "fresher's items": fresherKitsImg,
  "college essentials": collegeEssentialsImg,
  "other": othersImg,
  "snacks": snacksImg,
  "clothes": clothesImg,
  "accessories": accessoriesImg,
};

function getCategoryImage(categoryName) {
  if (!categoryName) return null;
  return categoryImageMap[categoryName.toLowerCase()] || null;
}

function Header({ searchQuery, setSearchQuery, onClearSearch }) {
  const navigate = useNavigate();
  const [hasUnreadNotif, setHasUnreadNotif] = useState(false);
  const userId = getUserId();

  useEffect(() => {
    if (!userId) return;

    fetch(`/api/notifications/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setHasUnreadNotif(data.some((n) => n.status === 'unread'));
        }
      })
      .catch(() => {});
  }, [userId]);

  return (
    <header className="topbar">
      <button className="icon-btn" aria-label="settings" onClick={() => navigate('/settings')}>
        <SettingsIcon size={22} />
      </button>

      <div className="search-pill">
        <span className="search-mark">⌕</span>
        <input
          type="text"
          placeholder="Search"
          aria-label="Search products"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button
            type="button"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center' }}
            onClick={onClearSearch}
            aria-label="Clear search"
          >
            <ClearIcon size={16} color="#a2cfce" />
          </button>
        )}
      </div>

      <button className="icon-btn" aria-label="notifications" onClick={() => navigate('/notifications')} style={{ position: 'relative' }}>
        <BellIcon size={22} />
        {hasUnreadNotif && (
          <span style={{
            position: 'absolute',
            top: 6, right: 6,
            width: 8, height: 8,
            borderRadius: '50%',
            background: '#ff686b',
            border: '2px solid #134141',
          }} />
        )}
      </button>
    </header>
  );
}

function Categories({ categories }) {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(0);

  if (!categories || categories.length === 0) return null;

  const previousCategory = categories[(activeIndex - 1 + categories.length) % categories.length];
  const currentCategory = categories[activeIndex];
  const nextCategory = categories[(activeIndex + 1) % categories.length];

  function goToPrevious() {
    setActiveIndex((i) => (i - 1 + categories.length) % categories.length);
  }
  function goToNext() {
    setActiveIndex((i) => (i + 1) % categories.length);
  }

  const prevImg = getCategoryImage(previousCategory?.name);
  const currImg = getCategoryImage(currentCategory?.name);
  const nextImg = getCategoryImage(nextCategory?.name);

  return (
    <section className="hero">
      <h1 className="hero-title">Categories</h1>
      <div className="carousel">
        <button className="arrow left" type="button" onClick={goToPrevious} aria-label="previous category">‹</button>

        <div
          className="card card-left"
          aria-hidden="true"
          style={{
            backgroundImage: prevImg ? `url(${prevImg})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {!prevImg && <span className="card-label-small">{previousCategory?.name}</span>}
        </div>

        <button
          className="card card-center"
          type="button"
          onClick={() => navigate('/category', { state: { category: currentCategory } })}
          aria-label="View category"
          style={{
            backgroundImage: currImg ? `url(${currImg})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {!currImg && <span className="card-label">{currentCategory?.name}</span>}
        </button>

        <div
          className="card card-right"
          aria-hidden="true"
          style={{
            backgroundImage: nextImg ? `url(${nextImg})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {!nextImg && <span className="card-label-small">{nextCategory?.name}</span>}
        </div>

        <button className="arrow right" type="button" onClick={goToNext} aria-label="next category">›</button>
      </div>

      <div className="dots">
        {categories.map((category, index) => (
          <span key={category.id} className={index === activeIndex ? "dot dot-active" : "dot"} aria-hidden="true" />
        ))}
      </div>
    </section>
  );
}

function ProductTile({ product, navigate }) {
  return (
    <button
      className="tile"
      type="button"
      onClick={() => navigate("/product", { state: { from: "/home", productId: product.id } })}
      aria-label={`Open ${product.name}`}
    >
      <div style={{ position: 'relative', width: '100%' }}>
        <img
          src={product.image_url}
          alt={product.name}
          style={{ width: '100%', display: 'block', objectFit: 'cover' }}
        />
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to top, rgba(19,65,65,0.9), rgba(19,65,65,0.2) 60%, transparent)',
        }} />
        <div style={{
          position: 'absolute',
          bottom: 0, left: 0, right: 0,
          padding: '14px',
          textAlign: 'left',
        }}>
          <p style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '11px',
            color: '#baecec',
            marginBottom: '4px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {product.name}
          </p>
          <p style={{
            fontFamily: "'Hanken Grotesk', sans-serif",
            fontSize: '18px',
            fontWeight: 700,
            color: '#fff',
          }}>
            ₹{product.price}
          </p>
        </div>
      </div>
    </button>
  );
}

function RandomElements({ products }) {
  const navigate = useNavigate();
  if (!products || products.length === 0) return null;

  const leftProducts = products.filter((_, idx) => idx % 2 === 0);
  const rightProducts = products.filter((_, idx) => idx % 2 === 1);

  return (
    <section className="random-marquee" aria-label="Products">
      <div className="random-column-wrapper">
        <div className="random-column random-column--left">
          {[...leftProducts, ...leftProducts].map((p, idx) => (
            <ProductTile key={`${p.id}-left-${idx}`} product={p} navigate={navigate} />
          ))}
        </div>
      </div>
      <div className="random-column-wrapper">
        <div className="random-column random-column--right random-column--offset">
          {[...rightProducts, ...rightProducts].map((p, idx) => (
            <ProductTile key={`${p.id}-right-${idx}`} product={p} navigate={navigate} />
          ))}
        </div>
      </div>
    </section>
  );
}

function SearchResults({ results, searching, query }) {
  const navigate = useNavigate();

  return (
    <section style={{ padding: '16px 20px', overflowY: 'auto', flex: 1 }}>
      <h2 style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontSize: '20px', color: '#baecec', marginBottom: '12px' }}>
        Search results for "{query}"
      </h2>

      {searching ? (
        <p style={{ color: '#c0c8c7', textAlign: 'center', padding: '30px 0' }}>Searching products...</p>
      ) : results.length === 0 ? (
        <p style={{ color: '#c0c8c7', textAlign: 'center', padding: '30px 0' }}>
          No available products found matching "{query}"
        </p>
      ) : (
        <div className="search-results-grid">
          {results.map((product) => (
            <ProductTile key={product.id} product={product} navigate={navigate} />
          ))}
        </div>
      )}
    </section>
  );
}

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const catRes = await fetch('/api/categories');
        const catData = await catRes.json();
        if (catData && !catData.error) {
          const seen = new Set();
          setCategories(catData.filter(c => seen.has(c.id) ? false : seen.add(c.id)));
        }

        const prodRes = await fetch('/api/products');
        const prodData = await prodRes.json();
        if (prodData && !prodData.error) {
          const seen = new Set();
          setProducts(prodData.filter(p => seen.has(p.id) ? false : seen.add(p.id)));
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    const timer = setTimeout(() => {
      fetch(`/api/products/search?q=${encodeURIComponent(searchQuery.trim())}`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) setSearchResults(data);
          setSearching(false);
        })
        .catch((err) => {
          console.error("Search error:", err);
          setSearching(false);
        });
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  return (
    <>
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onClearSearch={() => setSearchQuery('')}
      />
      {searchQuery.trim() ? (
        <SearchResults results={searchResults} searching={searching} query={searchQuery} />
      ) : (
        <>
          <Categories categories={categories} />
          <RandomElements products={products} />
        </>
      )}
    </>
  );
}