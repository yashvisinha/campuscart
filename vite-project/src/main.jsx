import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { API_BASE } from './config.js'

// Globally intercept fetch to prepend API_BASE to all /api/ requests automatically
if (typeof window !== 'undefined') {
  const originalFetch = window.fetch;
  window.fetch = function (input, init) {
    if (typeof input === 'string' && input.startsWith('/api/')) {
      input = `${API_BASE}${input}`;
    } else if (input instanceof URL && input.pathname.startsWith('/api/')) {
      if (API_BASE) {
        input = new URL(input.pathname + input.search + input.hash, API_BASE);
      }
    }
    return originalFetch.call(this, input, init);
  };
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

