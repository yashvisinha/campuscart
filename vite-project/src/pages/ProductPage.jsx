import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Home, ShoppingCart, Plus, User, MessageCircle } from 'lucide-react';
import './ProductPage.css';

import pfpDefault from '../assets/pfpDefault.png';

const ProductPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const backTo = location.state?.from || '/home';

  return (
    <div className="product-container">
      {/* Top Navigation Bar */}
      <div className="top-bar">
        <button className="back-btn" onClick={() => navigate(backTo)}>
          <ArrowLeft size={24} />
        </button>
        <h1 className="product-title">Product Name</h1>
        <div className="top-icons">
          <button>ℹ️</button>
          <button>🔍</button>
          <button>👤</button>
        </div>
      </div>

      {/* Product Image */}
      <div className="product-image-container">
        <div className="product-image">
          <img src={pfpDefault} alt="Product" />
        </div>
      </div>

      {/* Price */}
      <div className="price">₹199.20</div>

      {/* Description */}
      <div className="description">
        (Product description) Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
        Curabitur vitae nisi a enim sollicitudin feugiat. Vivamus eu congue sem. 
        Nullam et ante lorem. Morbi at ullamcorper orci blah blah.
      </div>

      {/* Action Buttons */}
      <div className="action-buttons">
        <button className="buy-now-btn">Buy Now</button>
        <button className="wishlist-btn">Add to Wishlist</button>
      </div>

      {/* Bottom Navigation - Clickable Icons */}
      <div className="bottom-nav">
        <button onClick={() => navigate('/') }>
          <Home size={24} />
        </button>
        <button onClick={() => alert("Cart clicked")}>
          <ShoppingCart size={24} />
        </button>
        <button onClick={() => alert("Plus clicked") }>
          <Plus size={28} />
        </button>
        <button onClick={() => alert("Chat clicked")}>
          <MessageCircle size={24} />
        </button>
        <button onClick={() => navigate('/you')}>
          <User size={24} />
        </button>
      </div>
    </div>
  );
};

export default ProductPage;