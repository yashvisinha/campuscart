const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function seed() {
  console.log("Seeding database...");
  
  // Clear existing
  await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('categories').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  // Insert categories
  const categories = ['Clothes', 'Snacks', 'Accessories', 'Fresher\'s items', 'College Essentials'];
  const { data: catData, error: catError } = await supabase
    .from('categories')
    .insert(categories.map(name => ({ name })))
    .select();

  if (catError) {
    console.error("Error inserting categories:", catError);
    return;
  }

  const catMap = {};
  catData.forEach(c => catMap[c.name] = c.id);

  // Insert products
  const products = [
    { category_id: catMap['Clothes'], name: 'Campus T-Shirt', description: 'Comfortable cotton t-shirt with college logo', price: 15.99, image_url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=500', stock: 50 },
    { category_id: catMap['Snacks'], name: 'Instant Noodles 12-pack', description: 'Late night study essential', price: 12.50, image_url: 'https://images.unsplash.com/photo-1612929633738-8fe01f38e605?auto=format&fit=crop&w=500', stock: 100 },
    { category_id: catMap['College Essentials'], name: 'Study Lamp', description: 'Adjustable LED desk lamp', price: 24.99, image_url: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=500', stock: 20 },
    { category_id: catMap['Accessories'], name: 'Backpack', description: 'Water-resistant laptop backpack', price: 35.00, image_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=500', stock: 30 }
  ];

  const { error: prodError } = await supabase.from('products').insert(products);
  
  if (prodError) {
    console.error("Error inserting products:", prodError);
    return;
  }

  console.log("Database seeded successfully!");
}

seed();
