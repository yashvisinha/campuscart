import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('Authenticating with DAuth...');
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;

    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code) {
      setStatus('Error: No authorization code received.');
      return;
    }

    hasFetched.current = true;

    const exchangeToken = async () => {
      try {
        const res = await fetch('/api/auth/dauth/callback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, state })
        });

        const data = await res.json();
        
        if (data.error) {
          throw new Error(data.error);
        }

        // Successfully exchanged token and got user profile
        // Store it in localStorage for now
        localStorage.setItem('dauth_user', JSON.stringify(data.user));
        localStorage.setItem('dauth_token', data.token);

        setStatus('Success! Redirecting...');
        
        // Short timeout for user experience, then redirect home
        setTimeout(() => {
          navigate('/home');
        }, 1000);
        
      } catch (err) {
        console.error('Failed to exchange code:', err);
        setStatus(`Authentication failed: ${err.message}`);
      }
    };

    exchangeToken();
  }, [searchParams, navigate]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
      <div style={{ padding: '30px', background: 'rgba(32,100,102,0.1)', borderRadius: '16px', border: '1px solid #206466', textAlign: 'center' }}>
        <h2 style={{ color: '#bffcff', marginBottom: '16px' }}>CampusCart Secure Login</h2>
        <p style={{ color: '#aaa', fontSize: '16px' }}>{status}</p>
      </div>
    </div>
  );
}
