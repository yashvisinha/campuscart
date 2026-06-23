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

app.listen(port, () => {
  console.log(`Backend server running on http://localhost:${port}`);
});
