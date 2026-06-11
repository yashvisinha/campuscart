import "./login.css";

export default function Login() {
  console.log('Rendering LoginPage');

  const handleGoogleLogin = async () => {
    try {
      const { supabase } = await import("../supabaseClient");
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (error) {
      console.error("Error logging in:", error);
      alert("Login failed: " + (error?.message || error));
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>CampusCart Login</h1>
        <p style={{color:'#666', marginBottom:12}}>If this page remains blank, open DevTools console.</p>
        <button onClick={handleGoogleLogin} className="google-btn">
          Sign in with Google
        </button>
      </div>
    </div>
  );
}