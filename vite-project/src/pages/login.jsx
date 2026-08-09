import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./login.css";
import { API_BASE } from '../config.js';


export default function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const redirectUri = `${window.location.origin}/auth/callback`;

  const isLocal = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' || 
    window.location.hostname === '127.0.0.1'
  );

  const handleBypassLogin = () => {
    localStorage.setItem("dauth_user", JSON.stringify({
      name: "Test User",
      email: "106125040@nitt.edu",
      rollNumber: "106125040"
    }));
    localStorage.setItem("dauth_token", "mock_token_local_dev");
    navigate("/home");
  };

  const handleDAuthLogin = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(
        `${API_BASE}/api/auth/dauth/url?redirectUri=${encodeURIComponent(redirectUri)}`,
      );
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
        <p style={{ color: "#666", marginBottom: 24 }}>
          Log in to access products, wishlist, and messages.
        </p>

        {error && (
          <div
            style={{
              color: "#ff4757",
              marginBottom: "16px",
              background: "rgba(255,71,87,0.1)",
              padding: "10px",
              borderRadius: "8px",
              fontSize: "14px",
            }}
          >
            {error}
          </div>
        )}

        <button
          onClick={handleDAuthLogin}
          className="google-btn"
          disabled={loading}
          style={{
            background: "#206466",
            color: "#bffcff",
            border: "1px solid #bffcff",
            width: "100%",
            padding: "14px",
            borderRadius: "12px",
            fontSize: "16px",
            fontWeight: "600",
            cursor: "pointer",
          }}
        >
          {loading ? "Redirecting..." : "Login with DAuth"}
        </button>

        {isLocal && (
          <button
            onClick={handleBypassLogin}
            style={{
              background: "rgba(255, 255, 255, 0.05)",
              color: "#aaa",
              border: "1px dashed #666",
              width: "100%",
              padding: "12px",
              borderRadius: "12px",
              fontSize: "14px",
              fontWeight: "500",
              cursor: "pointer",
              marginTop: "12px",
            }}
          >
            Bypass Login (Local Dev Only)
          </button>
        )}
      </div>
    </div>
  );
}

