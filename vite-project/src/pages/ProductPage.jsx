import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Home, ShoppingCart, Plus, User, MessageCircle, Heart } from 'lucide-react';
import { supabase } from '../supabaseClient';
import './ProductPage.css';

import pfpDefault from '../assets/pfpDefault.png';

const ProductPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const backTo = location.state?.from || '/home';

  const [product, setProduct] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [requests, setRequests] = useState([]);
  const [alreadyRequested, setAlreadyRequested] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);

  useEffect(() => {
    async function getUser() {
      const { data } = await supabase.auth.getSession();
      setCurrentUser(data?.session?.user || null);
    }
    getUser();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user || null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    async function fetchProduct() {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();
      if (error) console.error('Error fetching product:', error);
      else setProduct(data);
    }
    if (id) fetchProduct();
  }, [id]);

  useEffect(() => {
    async function fetchRequests() {
      if (!product || !currentUser) return;
      if (product.seller_id !== currentUser.id) return;

      const { data, error } = await supabase
        .from('buy_requests')
        .select('id, status, buyer_id, profiles:buyer_id (full_name, hostel)')
        .eq('product_id', id)
        .eq('status', 'pending');

      if (error) console.error('Error fetching requests:', error);
      else setRequests(data);
    }
    fetchRequests();
  }, [product, currentUser, id]);

  useEffect(() => {
    async function checkExisting() {
      if (!currentUser || !product) return;
      const { data } = await supabase
        .from('buy_requests')
        .select('id')
        .eq('product_id', id)
        .eq('buyer_id', currentUser.id)
        .maybeSingle();
      setAlreadyRequested(!!data);
    }
    checkExisting();
  }, [currentUser, product, id]);

  async function handleBuyNow() {
    if (!currentUser) {
      alert('Please log in first.');
      return;
    }
    if (!product) return;
    if (product.seller_id === currentUser.id) {
      alert("You can't buy your own item.");
      return;
    }

    const { error: reqError } = await supabase.from('buy_requests').insert({
      product_id: product.id,
      buyer_id: currentUser.id,
      seller_id: product.seller_id,
      status: 'pending',
    });

    if (reqError) {
      console.error('Error creating buy request:', reqError);
      alert('Something went wrong sending your request.');
      return;
    }

    const { error: notifError } = await supabase.from('notifications').insert({
      recipient_id: product.seller_id,
      type: 'buy_request',
      content: `Someone requested to buy your item "${product.name}"`,
      related_id: product.id,
    });
    if (notifError) console.error('Notification insert failed (buy request):', notifError);

    setAlreadyRequested(true);
    alert('Request sent to seller!');
  }

  async function handleAccept(request) {
    const { error: statusError } = await supabase
      .from('buy_requests')
      .update({ status: 'accepted' })
      .eq('id', request.id);
    if (statusError) console.error('Status update failed (accept):', statusError);

    const { error: msgError } = await supabase.from('messages').insert({
      sender_id: currentUser.id,
      receiver_id: request.buyer_id,
      content: `Hey! Thanks for your interest in "${product.name}". When would you like to pick it up?`,
    });
    if (msgError) console.error('Message insert failed:', msgError);

    const { error: notifError } = await supabase.from('notifications').insert({
      recipient_id: request.buyer_id,
      type: 'request_accepted',
      content: `Your request for "${product.name}" was accepted!`,
      related_id: product.id,
    });
    if (notifError) console.error('Notification insert failed (accept):', notifError);

    setRequests((prev) => prev.filter((r) => r.id !== request.id));
  }

  async function handleDecline(request) {
    const { error: statusError } = await supabase
      .from('buy_requests')
      .update({ status: 'declined' })
      .eq('id', request.id);
    if (statusError) console.error('Status update failed (decline):', statusError);

    const { error: notifError } = await supabase.from('notifications').insert({
      recipient_id: request.buyer_id,
      type: 'request_declined',
      content: `Your request for "${product.name}" was declined.`,
      related_id: product.id,
    });
    if (notifError) console.error('Notification insert failed (decline):', notifError);

    setRequests((prev) => prev.filter((r) => r.id !== request.id));
  }

  if (!product) {
    return <div className="product-container">Loading...</div>;
  }

  const isSeller = currentUser && product.seller_id === currentUser.id;
  const inStock = product.stock > 0;

  return (
    <div className="product-container">
      {/* Top Navigation Bar */}
      <div className="top-bar">
        <button className="back-btn" onClick={() => navigate(backTo)}>
          <ArrowLeft size={24} color="white" />
        </button>
        <h1 className="product-title">{product.name}</h1>
        <button className="heart-btn" onClick={() => setWishlisted(!wishlisted)}>
          <Heart size={22} color="white" fill={wishlisted ? "white" : "none"} />
        </button>
      </div>

      {/* Product Image */}
      <div className="product-image-container">
        <img src={product.image_url || pfpDefault} alt={product.name} className="product-image-full" />
      </div>

      {/* Info card overlapping image */}
      <div className="info-card">
        <h2 className="product-name">{product.name}</h2>
        <div className="price">₹{product.price}</div>

        <span className={`stock-badge ${inStock ? "in-stock" : "out-of-stock"}`}>
          {inStock ? `In Stock (${product.stock} left)` : "Out of Stock"}
        </span>

        <hr className="divider" />

        <div className="description-label">DESCRIPTION</div>
        <div className="description">{product.description}</div>

        {/* Buyer view */}
        {!isSeller && (
          <div className="action-buttons">
            <button
              className={`wishlist-btn ${wishlisted ? "wishlisted" : ""}`}
              onClick={() => setWishlisted(!wishlisted)}
            >
              <Heart size={18} fill={wishlisted ? "currentColor" : "none"} />
              {wishlisted ? " Wishlisted" : " Wishlist"}
            </button>
            <button
              className="buy-now-btn"
              onClick={handleBuyNow}
              disabled={alreadyRequested}
            >
              <ShoppingCart size={18} />
              {alreadyRequested ? " Request Sent" : " Buy Now"}
            </button>
          </div>
        )}

        {/* Seller view — requester list */}
        {isSeller && (
          <div className="requester-list">
            <h3>Buy Requests</h3>
            {requests.length === 0 && <p className="no-requests">No pending requests yet.</p>}
            {requests.map((req) => (
              <div key={req.id} className="requester-card">
                <div>
                  <strong>{req.profiles?.full_name || 'Unknown'}</strong>
                  <p>{req.profiles?.hostel || 'Hostel not set'}</p>
                </div>
                <div className="requester-actions">
                  <button className="accept-btn" onClick={() => handleAccept(req)}>Accept</button>
                  <button className="decline-btn" onClick={() => handleDecline(req)}>Decline</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="bottom-nav">
        <button onClick={() => navigate('/home')}><Home size={24} /></button>
        <button onClick={() => navigate('/cart')}><ShoppingCart size={24} /></button>
        <button onClick={() => navigate('/post')}><Plus size={28} /></button>
        <button onClick={() => navigate('/messages')}><MessageCircle size={24} /></button>
        <button onClick={() => navigate('/you')}><User size={24} /></button>
      </div>
    </div>
  );
};

export default ProductPage;