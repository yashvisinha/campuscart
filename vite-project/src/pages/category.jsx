import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Settings as SettingsIcon, Bell as BellIcon, ArrowLeft, X as ClearIcon } from "lucide-react";
import "./category.css";

function Header({ searchQuery, setSearchQuery }) {
  const navigate = useNavigate();
  return (
    <header className="topbar">
      <button className="icon-btn" aria-label="settings" onClick={() => navigate('/settings')}>
        <SettingsIcon size={24} />
      </button>
      <div className="search-pill">
        <span className="search-mark">⌕</span>
        <input
          type="text"
          placeholder="Search category..."
          aria-label="Search category"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button
            type="button"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center' }}
            onClick={() => setSearchQuery('')}
            aria-label="Clear search"
          >
            <ClearIcon size={16} color="#3b4b57" />
          </button>
        )}
      </div>
      <button className="icon-btn" aria-label="notifications" onClick={() => navigate('/notifications')}>
        <BellIcon size={24} />
      </button>
    </header>
  );
}

export default function Category() {
  const navigate = useNavigate();
  const location = useLocation();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const category = location.state?.category;

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const url = category
          ? '/api/products?category_id=' + category.id
          : '/api/products';
        const res = await fetch(url);
        const data = await res.json();
        if (data && !data.error) setProducts(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [category]);

  const handleCardClick = (productId) => {
    navigate('/product', { state: { from: '/category', productId } });
  };

  const filteredProducts = products.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.description && p.description.toLowerCase().includes(q))
    );
  });

  return (
    <>
      <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

      <div className="cat-header">
        <button className="cat-back" onClick={() => navigate(-1)} aria-label="Go back">
          <ArrowLeft size={20} />
        </button>
        <h1 className="cat-title">{category ? category.name : 'All Products'}</h1>
      </div>

      <section className="cat-grid" aria-label="Category items">
        {loading && (
          <div className="cat-loading">
            <div className="cat-spinner" />
          </div>
        )}

        {!loading && filteredProducts.length === 0 && (
          <div className="cat-empty">
            {searchQuery ? `No products matching "${searchQuery}"` : 'No products found in this category.'}
          </div>
        )}

        {filteredProducts.map((product) => (
          <article
            key={product.id}
            className="cat-card"
            onClick={() => handleCardClick(product.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handleCardClick(product.id)}
            aria-label={`View ${product.name}`}
          >
            <div
              className="cat-card-image"
              style={{
                backgroundImage: product.image_url
                  ? `url(${product.image_url})`
                  : 'none',
              }}
            />
            <div className="cat-card-info">
              <span className="cat-card-name">{product.name}</span>
              <span className="cat-card-price">₹{product.price}</span>
            </div>
          </article>
        ))}
      </section>
    </>
  );
}