import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, Heart } from 'lucide-react';
import './ProductPage.css';

const ProductPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const backTo = location.state?.from || '/home';
  const productId = location.state?.productId;

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [wishlisted, setWishlisted] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch('/api/products/' + productId);
        const data = await res.json();
        if (data && !data.error) setProduct(data);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    fetchProduct();
  }, [productId]);

  if (loading) {
    return (
      <div className="pp-loading">
        <div className="pp-spinner" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="pp-page">
        <div className="pp-topbar">
          <button className="pp-back" onClick={() => navigate(backTo)}>
            <ArrowLeft size={22} />
          </button>
          <span className="pp-topbar-title">Product</span>
        </div>
        <div className="pp-not-found">Product not found.</div>
      </div>
    );
  }

  return (
    <div className="pp-page">
      {/* Top Bar */}
      <div className="pp-topbar">
        <button className="pp-back" onClick={() => navigate(backTo)} aria-label="Go back">
          <ArrowLeft size={22} />
        </button>
        <span className="pp-topbar-title">{product.name}</span>
        <button
          className={`pp-heart ${wishlisted ? 'pp-heart--active' : ''}`}
          onClick={() => setWishlisted(w => !w)}
          aria-label="Wishlist"
        >
          <Heart size={22} fill={wishlisted ? '#ff4757' : 'none'} />
        </button>
      </div>

      {/* Scrollable content */}
      <div className="pp-scroll">
        {/* Hero Image */}
        <div className="pp-image-wrap">
          <img
            src={product.image_url || 'https://placehold.co/400x300/184849/bffcff?text=No+Image'}
            alt={product.name}
            className="pp-image"
          />
        </div>

        {/* Info Card */}
        <div className="pp-info-card">
          <h2 className="pp-name">{product.name}</h2>
          <div className="pp-price">₹{product.price}</div>

          <div className="pp-meta-row">
            {product.stock !== undefined && (
              <div className={`pp-stock ${product.stock > 0 ? 'pp-stock--in' : 'pp-stock--out'}`}>
                {product.stock > 0 ? `In Stock (${product.stock} left)` : 'Out of Stock'}
              </div>
            )}
            
            <button 
              className="pp-seller-badge"
              onClick={() => navigate(`/conversation/${product.uploader_id || 'rohan'}`)}
              aria-label={`Chat with seller ${product.uploader_id || 'rohan'}`}
            >
              Seller: <strong>{product.uploader_id || 'rohan'}</strong>
            </button>
          </div>

          <div className="pp-divider" />

          <h3 className="pp-section-title">Description</h3>
          <p className="pp-description">{product.description || 'No description available.'}</p>

          {/* Action Buttons */}
          <div className="pp-actions">
            <button className="pp-btn pp-btn--wishlist" onClick={() => setWishlisted(w => !w)}>
              <Heart size={18} fill={wishlisted ? '#ff4757' : 'none'} />
              {wishlisted ? 'Wishlisted' : 'Add to Wishlist'}
            </button>
            <button className="pp-btn pp-btn--buy">
              <ShoppingCart size={18} />
              Buy Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductPage;