import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings as SettingsIcon, Bell as BellIcon, Edit2, Heart, X, Trash2 } from 'lucide-react';
import { getUserId, getUser } from '../auth';
import { useWishlist } from '../context/WishlistContext';
import { API_BASE } from '../config.js';
import './home.css';
import './YouPage.css';

export default function YouPage() {
  const navigate = useNavigate();
  const userId = getUserId();
  const userInfo = getUser();
  const { wishlist, remove: removeFromWishlist } = useWishlist();

  const [myListings, setMyListings] = useState([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [categories, setCategories] = useState([]);

  // Modal edit state
  const [editingProduct, setEditingProduct] = useState(null);
  const [editFormData, setEditFormData] = useState({
    title: '',
    details: '',
    price: '',
    category_id: '',
  });
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadListings = async () => {
    if (!userId) {
      setLoadingListings(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/users/${userId}/products`);
      if (res.ok) {
        const data = await res.json();
        setMyListings(data || []);
      }
    } catch (err) {
      console.error('Failed to load user products', err);
    } finally {
      setLoadingListings(false);
    }
  };

  const loadCategories = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/categories`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setCategories(data);
      }
    } catch (err) {
      console.error('Failed to load categories', err);
    }
  };

  useEffect(() => {
    if (!userId) {
      navigate('/login');
      return;
    }
    loadListings();
    loadCategories();
  }, [userId, navigate]);

  const openEditModal = (product, e) => {
    e.stopPropagation();
    // Confirm owner check
    if (String(product.uploader_id) !== String(userId)) {
      alert('Only the product owner can edit this listing.');
      return;
    }

    setEditingProduct(product);
    setEditFormData({
      title: product.name || '',
      details: product.description || '',
      price: product.price || '',
      category_id: product.category_id || '',
    });
    setEditError('');
    setConfirmDelete(false);
    // Re-fetch categories in case they failed on mount
    if (categories.length === 0) loadCategories();
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    if (!editingProduct) return;

    setSaving(true);
    setEditError('');

    try {
      const res = await fetch(`${API_BASE}/api/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editFormData.title,
          details: editFormData.details,
          price: editFormData.price,
          category_id: editFormData.category_id,
          uploader_id: userId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update product');
      }

      setEditingProduct(null);
      await loadListings();
    } catch (err) {
      setEditError(err.message || 'Error updating product');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteListing = async () => {
    if (!editingProduct) return;
    setDeleting(true);
    setEditError('');
    try {
      const res = await fetch(`/api/products/${editingProduct.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uploader_id: userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete listing');
      setEditingProduct(null);
      setConfirmDelete(false);
      await loadListings();
    } catch (err) {
      setEditError(err.message || 'Error deleting listing');
      setConfirmDelete(false);
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!editingProduct) return;
    const newStatus = editingProduct.status === 'sold' ? 'available' : 'sold';
    setSaving(true);
    setEditError('');
    try {
      const res = await fetch(`/api/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uploader_id: userId, status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update status');
      // Update local state so pill reflects change immediately
      setEditingProduct((prev) => ({ ...prev, status: newStatus }));
      await loadListings();
    } catch (err) {
      setEditError(err.message || 'Error updating status');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
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

      <div className="you-body">
        <h1 className="you-page-title">
          {userInfo?.name ? `Hello, ${userInfo.name.split(' ')[0]}` : 'Your Profile'}
        </h1>

        {/* Section 1: My Listings */}
        <section className="you-section">
          <div className="you-section-header">
            <h2>My Listings</h2>
            <span className="you-section-subtitle" onClick={() => navigate('/post')}>
              + Add New
            </span>
          </div>

          {loadingListings ? (
            <p className="you-empty-text">Loading listings...</p>
          ) : myListings.length === 0 ? (
            <p className="you-empty-text">You haven't listed any products yet.</p>
          ) : (
            <div className="you-cards-grid">
              {myListings.map((product) => (
                <div
                  key={product.id}
                  className="you-listing-card"
                  onClick={(e) => openEditModal(product, e)}
                  role="button"
                  tabIndex={0}
                >
                  <div
                    className="you-card-img-wrap"
                    style={{
                      backgroundImage: product.image_url ? `url(${product.image_url})` : 'none',
                    }}
                  >
                    <span
                      className={`you-status-badge ${
                        product.status === 'sold'
                          ? 'you-status-badge--sold'
                          : 'you-status-badge--available'
                      }`}
                    >
                      {product.status === 'sold' ? 'Sold' : 'Available'}
                    </span>
                  </div>

                  <div className="you-card-details">
                    <span className="you-card-name">{product.name}</span>
                    <span className="you-card-price">₹{product.price}</span>
                    <span className="you-edit-label">
                      <Edit2 size={12} /> Edit listing
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Section 2: Wishlist */}
        <section className="you-section">
          <div className="you-section-header">
            <h2>Wishlist</h2>
            <span className="you-section-subtitle" onClick={() => navigate('/wishlist')}>
              View All ({wishlist.length})
            </span>
          </div>

          {wishlist.length === 0 ? (
            <p className="you-empty-text">No items in your wishlist.</p>
          ) : (
            <div className="you-cards-grid">
              {wishlist.slice(0, 4).map((product) => (
                <div
                  key={product.id}
                  className="you-listing-card"
                  onClick={() => navigate('/product', { state: { from: '/you', productId: product.id } })}
                  role="button"
                  tabIndex={0}
                >
                  <div
                    className="you-card-img-wrap"
                    style={{
                      backgroundImage: product.image_url ? `url(${product.image_url})` : 'none',
                    }}
                  >
                    <button
                      type="button"
                      style={{
                        position: 'absolute',
                        top: 6,
                        right: 6,
                        background: 'rgba(0,0,0,0.5)',
                        border: 'none',
                        borderRadius: '50%',
                        padding: 6,
                        cursor: 'pointer',
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromWishlist(product.id);
                      }}
                      aria-label="Remove from wishlist"
                    >
                      <Heart size={16} fill="#ff4757" color="#ff4757" />
                    </button>
                  </div>

                  <div className="you-card-details">
                    <span className="you-card-name">{product.name}</span>
                    <span className="you-card-price">₹{product.price}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Owner Edit Modal */}
      {editingProduct && (
        <div className="you-modal-overlay" onClick={() => setEditingProduct(null)}>
          <div className="you-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="you-modal-header">
              <h2>Edit Listing</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  className={`you-status-toggle ${
                    editingProduct.status === 'sold'
                      ? 'you-status-toggle--sold'
                      : 'you-status-toggle--available'
                  }`}
                  onClick={handleToggleStatus}
                  disabled={saving}
                  title="Click to toggle sold/available"
                >
                  {editingProduct.status === 'sold' ? '🔴 Sold' : '🟢 Available'}
                </button>
                <button
                  type="button"
                  className="you-modal-close"
                  onClick={() => setEditingProduct(null)}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <form onSubmit={handleEditSave}>
              <div className="you-form-group">
                <label>Title</label>
                <input
                  type="text"
                  value={editFormData.title}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                  required
                />
              </div>

              <div className="you-form-group">
                <label>Price (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editFormData.price}
                  onChange={(e) => setEditFormData({ ...editFormData, price: e.target.value })}
                  required
                />
              </div>

              <div className="you-form-group">
                <label>Category</label>
                <select
                  value={editFormData.category_id}
                  onChange={(e) => setEditFormData({ ...editFormData, category_id: e.target.value })}
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="you-form-group">
                <label>Description</label>
                <textarea
                  rows="3"
                  value={editFormData.details}
                  onChange={(e) => setEditFormData({ ...editFormData, details: e.target.value })}
                />
              </div>

              {editError && <p style={{ color: '#ff4757', fontSize: '13px' }}>{editError}</p>}

              <div className="you-modal-actions">
                {confirmDelete ? (
                  <>
                    <span className="you-delete-confirm-text">Are you sure?</span>
                    <button
                      type="button"
                      className="you-btn-cancel"
                      onClick={() => setConfirmDelete(false)}
                      disabled={deleting}
                    >
                      No, keep it
                    </button>
                    <button
                      type="button"
                      className="you-btn-delete"
                      onClick={handleDeleteListing}
                      disabled={deleting}
                    >
                      {deleting ? 'Deleting...' : 'Yes, delete'}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className="you-btn-delete-ghost"
                      onClick={() => setConfirmDelete(true)}
                      title="Delete this listing"
                    >
                      <Trash2 size={15} /> Delete
                    </button>
                    <button
                      type="button"
                      className="you-btn-cancel"
                      onClick={() => setEditingProduct(null)}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="you-btn-save" disabled={saving}>
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
