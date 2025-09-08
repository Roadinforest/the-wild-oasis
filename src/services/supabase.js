// import { createClient } from '@supabase/supabase-js';

// const supabaseUrl = 'https://brshhzwhidatgeojayyt.supabase.co';
// const supabaseKey =
//   'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyc2hoendoaWRhdGdlb2pheXl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczMzM4MTIsImV4cCI6MjA3MjkwOTgxMn0.QR93bts4NwNKUqEGar3iTqFAlkcSGJq98YgZaaWD6l0';

// // Create a single supabase client for interacting with your database
// const supabase = createClient(supabaseUrl, supabaseKey);

// export default supabase;



import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase env vars');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;