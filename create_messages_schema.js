require('dotenv').config({ path: './backend/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function createMessagesTable() {
  console.log('Creating messages table using raw SQL...');
  // Since we don't have migrations setup and can't use raw SQL with Anon Key easily if not exposed,
  // Let's create a quick function using Supabase REST API or just manually tell the user to run SQL.
  // Wait, earlier the user had a Service Role Key, but currently backend/.env only has SUPABASE_ANON_KEY.
  console.log('Please run the following SQL in your Supabase SQL Editor:');
  console.log(`
    CREATE TABLE IF NOT EXISTS messages (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      sender_id TEXT NOT NULL,
      receiver_id TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
    );
  `);
}

createMessagesTable();
