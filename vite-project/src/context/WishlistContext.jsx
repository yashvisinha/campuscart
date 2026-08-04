import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getUserId } from '../auth';

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const [wishlist, setWishlist] = useState([]);
  const userId = getUserId();

  // Load wishlist from DB if user is logged in, else from local storage
  const refreshWishlist = useCallback(async () => {
    const currentUserId = getUserId();
    if (currentUserId) {
      try {
        const res = await fetch(`/api/wishlist/${currentUserId}`);
        const data = await res.json();
        if (Array.isArray(data)) {
          setWishlist(data);
          localStorage.setItem('cc_wishlist', JSON.stringify(data));
          return;
        }
      } catch (err) {
        console.error('Failed to load DB wishlist:', err);
      }
    }

    try {
      setWishlist(JSON.parse(localStorage.getItem('cc_wishlist') || '[]'));
    } catch {
      setWishlist([]);
    }
  }, []);

  useEffect(() => {
    refreshWishlist();
  }, [refreshWishlist, userId]);

  const toggle = async (product) => {
    if (!product || !product.id) return;
    const currentUserId = getUserId();
    const exists = wishlist.some((p) => p.id === product.id);

    // Optimistic UI update
    setWishlist((prev) =>
      exists ? prev.filter((p) => p.id !== product.id) : [...prev, product]
    );

    if (currentUserId) {
      try {
        if (exists) {
          await fetch(`/api/wishlist/${currentUserId}/${product.id}`, {
            method: 'DELETE',
          });
        } else {
          await fetch('/api/wishlist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: currentUserId,
              product_id: product.id,
            }),
          });
        }
      } catch (err) {
        console.error('Failed to sync wishlist with DB:', err);
      }
    }
  };

  const isWishlisted = (productId) => wishlist.some((p) => p.id === productId);

  const remove = async (productId) => {
    const currentUserId = getUserId();
    setWishlist((prev) => prev.filter((p) => p.id !== productId));

    if (currentUserId && productId) {
      try {
        await fetch(`/api/wishlist/${currentUserId}/${productId}`, {
          method: 'DELETE',
        });
      } catch (err) {
        console.error('Failed to remove item from DB wishlist:', err);
      }
    }
  };

  return (
    <WishlistContext.Provider
      value={{ wishlist, toggle, isWishlisted, remove, refreshWishlist }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  return useContext(WishlistContext);
}
