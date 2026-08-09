import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, Heart } from 'lucide-react';
import './ProductPage.css';
import { useWishlist } from '../context/WishlistContext';
import { getUserId } from '../auth';
import { API_BASE } from '../config.js';

const ProductPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const backTo = location.state?.from || '/home';
  const productId = location.state?.productId;

  const { toggle, isWishlisted } = useWishlist();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [buyMessage, setBuyMessage] = useState('');
  const [buyError, setBuyError] = useState('');

  const currentUserId = getUserId();

  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/api/products/` + productId);
        const data = await res.json();
        if (data && !data.error) setProduct(data);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    fetchProduct();
  }, [productId]);

  const handleBuyNow = async () => {
    setBuyError('');
    setBuyMessage('');

    if (!currentUserId) {
      navigate('/login');
      return;
    }

    if (!product) return;

    if (product.status === 'sold') {
      setBuyError('This product has already been sold.');
      return;
    }

    const sellerId = product.uploader_id;
    if (!sellerId) {
      setBuyError('Seller details are missing for this item.');
      return;
    }

    if (String(sellerId) === String(currentUserId)) {
      setBuyError('You cannot buy your own product.');
      return;
    }

    setBuying(true);

    try {
      const res = await fetch(`${API_BASE}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: product.id,
          buyer_id: currentUserId,
          seller_id: sellerId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to place purchase request.');
      }

      setBuyMessage('Purchase request sent! The seller has been notified.');
    } catch (err) {
      setBuyError(err.message || 'Unable to buy product.');
    } finally {
      setBuying(false);
    }
  };

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

  const sellerDisplayName = product.uploader_id || 'Unknown seller';
  const isSold = product.status === 'sold';

  return (
    <div className="pp-page">
      {/* Top Bar */}
      <div className="pp-topbar">
        <button className="pp-back" onClick={() => navigate(backTo)} aria-label="Go back">
          <ArrowLeft size={22} />
        </button>
        <span className="pp-topbar-title">{product.name}</span>
        <button
          className={`pp-heart ${product && isWishlisted(product.id) ? 'pp-heart--active' : ''}`}
          onClick={() => { if (product) { toggle(product); } }}
          aria-label="Wishlist"
        >
          <Heart size={22} fill={product && isWishlisted(product.id) ? '#ff4757' : 'none'} />
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
            <div className={`pp-stock ${isSold ? 'pp-stock--out' : 'pp-stock--in'}`}>
              {isSold ? 'Sold' : 'Available'}
            </div>
            
            {product.uploader_id ? (
              <button 
                className="pp-seller-badge"
                onClick={() => navigate(`/conversation/${product.uploader_id}`)}
                aria-label={`Chat with seller ${product.uploader_id}`}
              >
                Seller: <strong>{sellerDisplayName}</strong>
              </button>
            ) : (
              <span className="pp-seller-badge">Seller: Unknown</span>
            )}
          </div>

          <div className="pp-divider" />

          <h3 className="pp-section-title">Description</h3>
          <p className="pp-description">{product.description || 'No description available.'}</p>

          {buyError && <p style={{ color: '#ff4757', marginTop: '12px', fontSize: '14px' }}>{buyError}</p>}
          {buyMessage && <p style={{ color: '#2ed573', marginTop: '12px', fontSize: '14px' }}>{buyMessage}</p>}

          {/* Action Buttons */}
          <div className="pp-actions" style={{ marginTop: '16px' }}>
            <button className="pp-btn pp-btn--wishlist" onClick={() => { if (product) { toggle(product); } }}>
              <Heart size={18} fill={product && isWishlisted(product.id) ? '#ff4757' : 'none'} />
              {product && isWishlisted(product.id) ? 'Wishlisted' : 'Add to Wishlist'}
            </button>
            <button 
              className="pp-btn pp-btn--buy"
              onClick={handleBuyNow}
              disabled={buying || isSold}
              style={{ opacity: isSold ? 0.6 : 1 }}
            >
              <ShoppingCart size={18} />
              {isSold ? 'Sold Out' : buying ? 'Sending...' : 'Buy Now'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductPage;