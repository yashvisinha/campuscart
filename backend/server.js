const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// GET /api/categories
app.get('/api/categories', async (req, res) => {
  console.log("Fetching categories...");
  const { data, error } = await supabase.from('categories').select('*').order('created_at');
  console.log("Data:", data, "Error:", error);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET /api/products
app.get('/api/products', async (req, res) => {
  const { category_id } = req.query;
  let query = supabase.from('products').select('*');
  
  if (category_id) {
    query = query.eq('category_id', category_id);
  } else {
    query = query.limit(10);
  }
  
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET /api/products/:id
app.get('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
  
  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Product not found' });
  
  res.json(data);
});

// POST /api/auth/dauth/callback
app.post('/api/auth/dauth/callback', async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'No code provided' });

  try {
    // 1. Exchange code for token
    const tokenParams = new URLSearchParams({
      client_id: process.env.DAUTH_CLIENT_ID,
      client_secret: process.env.DAUTH_CLIENT_SECRET,
      grant_type: 'authorization_code',
      redirect_uri: process.env.DAUTH_REDIRECT_URI,
      code
    });

    const tokenRes = await fetch('https://auth.delta.nitt.edu/api/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenParams
    });
    
    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      throw new Error(`Token exchange failed: ${err}`);
    }
    
    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;
    
    // 2. Fetch user profile
    const userRes = await fetch('https://auth.delta.nitt.edu/api/resources/user', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!userRes.ok) {
      const err = await userRes.text();
      throw new Error(`User fetch failed: ${err}`);
    }
    
    const userData = await userRes.json();
    
    res.json({ user: userData, token: accessToken });
    
  } catch (error) {
    console.error('DAuth Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/auth/dauth/url
app.get('/api/auth/dauth/url', (req, res) => {
  const clientId = process.env.DAUTH_CLIENT_ID;
  const redirectUri = process.env.DAUTH_REDIRECT_URI;
  const state = Math.random().toString(36).substring(7); // Simple random state
  
  if (!clientId || !redirectUri) {
    return res.status(500).json({ error: 'DAuth credentials not configured on backend.' });
  }

  // Common DAuth scopes: email, profile, user, openid, oidc
  const authUrl = `https://auth.delta.nitt.edu/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent('email profile user oidc')}&state=${state}&nonce=${state}`;
  
  res.json({ url: authUrl });
});

app.listen(port, () => {

  console.log(`Backend server running on http://localhost:${port}`);
});
