const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gbkvvpztprvmceclvfiz.supabase.co';
const supabaseKey = 'sb_publishable_1zjsNPi0uW7AMJf-bHGUIQ_J68q1MVI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log("Fetching categories...");
  const { data, error } = await supabase.from('categories').select('*');
  console.log("Data:", data, "Error:", error);
  
  if (data && data.length === 0) {
    console.log("Table is empty. Attempting to insert a row...");
    const { data: insertData, error: insertError } = await supabase.from('categories').insert([{ name: 'Test Category' }]).select();
    console.log("Insert Data:", insertData, "Insert Error:", insertError);
  }
}

test();
