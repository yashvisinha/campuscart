import { createContext, useContext, useState, useEffect } from 'react';

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const [wishlist, setWishlist] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('cc_wishlist') || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('cc_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  const toggle = (product) => {
    setWishlist((prev) => {
      const exists = prev.some((p) => p.id === product.id);
      return exists ? prev.filter((p) => p.id !== product.id) : [...prev, product];
    });
  };

  const isWishlisted = (productId) => wishlist.some((p) => p.id === productId);

  const remove = (productId) => setWishlist((prev) => prev.filter((p) => p.id !== productId));

  return (
    <WishlistContext.Provider value={{ wishlist, toggle, isWishlisted, remove }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  return useContext(WishlistContext);
}
