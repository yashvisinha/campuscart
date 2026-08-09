// Central API base URL.
// - Local dev: empty string → Vite proxy routes /api → localhost:5000
// - Production (Render): points to the deployed backend
const isLocal = typeof window !== 'undefined' && (
  window.location.hostname === 'localhost' || 
  window.location.hostname === '127.0.0.1' || 
  window.location.hostname.startsWith('192.168.') || 
  window.location.hostname.startsWith('10.')
);

export const API_BASE = import.meta.env.VITE_API_BASE_URL || (isLocal ? '' : 'https://campuscart-backend-fpu0.onrender.com');
