import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, ShoppingCart, Trash2 } from 'lucide-react';
import { useWishlist } from '../../context/WishlistContext';
import './WishlistPage.css';

export default function WishlistPage() {
  const navigate = useNavigate();
  const { wishlist, remove } = useWishlist();

  return (
    <>
      {/* Top Bar */}
      <header className="wl-topbar">
        <button className="wl-back" onClick={() => navigate(-1)} aria-label="Go back">
          <ArrowLeft size={22} />
        </button>
        <h1 className="wl-topbar-title">My Wishlist</h1>
        <div className="wl-topbar-badge">
          <Heart size={20} fill="#ff4757" color="#ff4757" />
          {wishlist.length > 0 && (
            <span className="wl-badge">{wishlist.length}</span>
          )}
        </div>
      </header>

      {/* Content */}
      <section className="wl-content">
        {wishlist.length === 0 ? (
          <div className="wl-empty">
            <Heart size={64} color="rgba(191,252,255,0.25)" />
            <p>Your wishlist is empty</p>
            <button className="wl-browse-btn" onClick={() => navigate('/home')}>
              Browse Products
            </button>
          </div>
        ) : (
          <div className="wl-list">
            {wishlist.map((product) => (
              <article key={product.id} className="wl-card">
                {/* Product image */}
                <div
                  className="wl-card-image"
                  style={{
                    backgroundImage: product.image_url
                      ? `url(${product.image_url})`
                      : 'none',
                  }}
                  onClick={() => navigate('/product', { state: { from: '/wishlist', productId: product.id } })}
                  role="button"
                  tabIndex={0}
                  aria-label={`View ${product.name}`}
                />

                {/* Info */}
                <div className="wl-card-info">
                  <div className="wl-card-text">
                    <h2 className="wl-card-name">{product.name}</h2>
                    <p className="wl-card-desc">{product.description}</p>
                    <span className="wl-card-price">₹{product.price}</span>
                  </div>

                  <div className="wl-card-actions">
                    <button
                      className="wl-buy-btn"
                      onClick={() => navigate('/product', { state: { from: '/wishlist', productId: product.id } })}
                    >
                      <ShoppingCart size={16} />
                      Buy Now
                    </button>
                    <button
                      className="wl-remove-btn"
                      onClick={() => remove(product.id)}
                      aria-label="Remove from wishlist"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
