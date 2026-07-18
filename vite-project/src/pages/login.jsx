import { useState } from "react";
import "./login.css";

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleDAuthLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await fetch('/api/auth/dauth/url');
      const data = await res.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      if (data.url) {
        // Redirect the user to DAuth's authorization page
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Error initiating DAuth login:", err);
      setError(err.message || "Failed to initiate login");
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>CampusCart</h1>
        <p style={{color:'#666', marginBottom:24}}>Log in to access products, wishlist, and messages.</p>
        
        {error && <div style={{color: '#ff4757', marginBottom: '16px', background: 'rgba(255,71,87,0.1)', padding: '10px', borderRadius: '8px', fontSize: '14px'}}>{error}</div>}
        
        <button 
          onClick={handleDAuthLogin} 
          className="google-btn" 
          disabled={loading}
          style={{ background: '#206466', color: '#bffcff', border: '1px solid #bffcff', width: '100%', padding: '14px', borderRadius: '12px', fontSize: '16px', fontWeight: '600', cursor: 'pointer' }}
        >
          {loading ? "Redirecting..." : "Login with DAuth"}
        </button>
      </div>
    </div>
  );
}