import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { API_BASE } from '../config.js';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const code = searchParams.get("code");
  const token = searchParams.get("token");
  const user = searchParams.get("user");
  const hasFetched = useRef(false);
  const authError = searchParams.get("error") || searchParams.get("auth_error");
  const statusText = authError
    ? `Authentication failed: ${authError}`
    : token && user
      ? "Success! Redirecting..."
      : code
        ? "Authenticating with DAuth..."
        : "Error: No authorization code received.";

  useEffect(() => {
    if (hasFetched.current) return;

    const state = searchParams.get("state");

    if (token && user) {
      hasFetched.current = true;

      try {
        const userData = JSON.parse(user);
        localStorage.setItem("dauth_user", JSON.stringify(userData));
        localStorage.setItem("dauth_token", token);

        setTimeout(() => {
          navigate("/home");
        }, 1000);
      } catch (err) {
        console.error("Failed to store callback data:", err);
        navigate(`/login?auth_error=${encodeURIComponent(err.message)}`);
      }

      return;
    }

    if (!code) {
      return;
    }

    hasFetched.current = true;

    const exchangeToken = async () => {
      try {
        const redirectUri = `${window.location.origin}/auth/callback`;

        const res = await fetch(`${API_BASE}/api/auth/dauth/callback`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, state, redirectUri }),
        });

        const data = await res.json();

        if (data.error) {
          throw new Error(data.error);
        }

        // Successfully exchanged token and got user profile
        // Store it in localStorage for now
        localStorage.setItem("dauth_user", JSON.stringify(data.user));
        localStorage.setItem("dauth_token", data.token);

        // Short timeout for user experience, then redirect home
        setTimeout(() => {
          navigate("/home");
        }, 1000);
      } catch (err) {
        console.error("Failed to exchange code:", err);
        navigate(`/login?auth_error=${encodeURIComponent(err.message)}`);
      }
    };

    exchangeToken();
  }, [searchParams, navigate, code, token, user]);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          padding: "30px",
          background: "rgba(32,100,102,0.1)",
          borderRadius: "16px",
          border: "1px solid #206466",
          textAlign: "center",
        }}
      >
        <h2 style={{ color: "#bffcff", marginBottom: "16px" }}>
          CampusCart Secure Login
        </h2>
        <p style={{ color: "#aaa", fontSize: "16px" }}>{statusText}</p>
      </div>
    </div>
  );
}
