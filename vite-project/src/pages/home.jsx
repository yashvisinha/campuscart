import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Settings as SettingsIcon,
  Bell as BellIcon,
  X as ClearIcon,
} from "lucide-react";
import "./home.css";

// Header component with debounced search
function Header({ searchQuery, setSearchQuery, onClearSearch }) {
  const navigate = useNavigate();

  return (
    <header className="topbar">
      <button className="icon-btn" aria-label="settings" onClick={() => navigate('/settings')}>
        <SettingsIcon size={28} />
      </button>

      <div className="search-pill">
        <span className="search-mark">⌕</span>
        <input
          type="text"
          placeholder="Search products..."
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
            <ClearIcon size={16} color="#3b4b57" />
          </button>
        )}
      </div>

      <button className="icon-btn" aria-label="notifications" onClick={() => navigate('/notifications')}>
        <BellIcon size={28} />
      </button>
    </header>
  );
}

// Categories + carousel
function Categories({ categories }) {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(0);

  if (!categories || categories.length === 0) return null;

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

  if (!products || products.length === 0) return null;

  const goToProduct = (product) =>
    navigate("/product", { state: { from: "/home", productId: product.id } });

  const renderTile = (product, keyPrefix, index) => (
    <button
      key={`${keyPrefix}-${product.id}-${index}`}
      type="button"
      className="tile"
      style={{
        height: "170px",
        backgroundImage: `url(${product.image_url})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
      onClick={() => goToProduct(product)}
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
        lineHeight: 1.4,
      }}>
        {product.name}<br />
        <span style={{ color: '#bffcff', fontWeight: 700 }}>₹{product.price}</span>
      </div>
    </button>
  );

  // With fewer than 4 items the animation copies would be visible — use a plain grid instead
  if (products.length < 4) {
    return (
      <section style={{ padding: '0 16px 16px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
        {products.map((p, i) => renderTile(p, 'grid', i))}
      </section>
    );
  }

  const firstHalf = products.slice(0, Math.ceil(products.length / 2));
  const secondHalf = products.slice(Math.ceil(products.length / 2));

  return (
    <section
      className="random-marquee"
      aria-label="Auto scrolling categories preview"
    >
      <div className="marquee-column marquee-up">
        <div className="marquee-track">
          {firstHalf.map((p, i) => renderTile(p, 'left', i))}
          {firstHalf.map((p, i) => renderTile(p, 'left-copy', i))}
        </div>
      </div>

      <div className="marquee-column marquee-down">
        <div className="marquee-track">
          {secondHalf.map((p, i) => renderTile(p, 'right', i))}
          {secondHalf.map((p, i) => renderTile(p, 'right-copy', i))}
        </div>
      </div>
    </section>
  );
}

// Search Results Grid Component
function SearchResults({ results, searching, query }) {
  const navigate = useNavigate();

  return (
    <section className="search-results-section" style={{ padding: '16px', overflowY: 'auto', flex: 1 }}>
      <h2 style={{ fontSize: '20px', color: '#bffcff', marginBottom: '12px' }}>
        Search results for "{query}"
      </h2>

      {searching ? (
        <p style={{ color: '#aaa', textAlign: 'center', padding: '30px 0' }}>Searching products...</p>
      ) : results.length === 0 ? (
        <p style={{ color: '#aaa', textAlign: 'center', padding: '30px 0' }}>
          No available products found matching "{query}"
        </p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
          {results.map((product) => (
            <div
              key={product.id}
              onClick={() => navigate('/product', { state: { from: '/home', productId: product.id } })}
              style={{
                background: 'rgba(32, 100, 102, 0.4)',
                border: '1px solid rgba(191, 252, 255, 0.3)',
                borderRadius: '16px',
                overflow: 'hidden',
                cursor: 'pointer',
              }}
            >
              <div
                style={{
                  height: '110px',
                  backgroundImage: product.image_url ? `url(${product.image_url})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundColor: '#123c3d',
                }}
              />
              <div style={{ padding: '10px' }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {product.name}
                </div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#bffcff', marginTop: '4px' }}>
                  ₹{product.price}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// Complete home page
export default function Home() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const catRes = await fetch('/api/categories');
        const catData = await catRes.json();
        if (catData && !catData.error) {
          // Deduplicate by id
          const seen = new Set();
          setCategories(catData.filter(c => seen.has(c.id) ? false : seen.add(c.id)));
        }

        const prodRes = await fetch('/api/products');
        const prodData = await prodRes.json();
        if (prodData && !prodData.error) {
          // Deduplicate by id
          const seen = new Set();
          setProducts(prodData.filter(p => seen.has(p.id) ? false : seen.add(p.id)));
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };
    fetchData();
  }, []);

  // Debounced search effect
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
        <SearchResults
          results={searchResults}
          searching={searching}
          query={searchQuery}
        />
      ) : (
        <>
          <Categories categories={categories} />
          <RandomElements products={products} />
        </>
      )}
    </>
  );
}