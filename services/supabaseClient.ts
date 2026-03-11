import { createClient } from '@supabase/supabase-js';

// Vercel Supabase integration provides VITE_ env variables typically, 
// using the explicit ones provided by the user as fallbacks.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://oobkdacjlomxoobhvkkd.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vYmtkYWNqbG9teG9vYmh2a2tkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3NzIwMTcsImV4cCI6MjA4ODM0ODAxN30.21MiKFEBigAr3Q9k30Y_3MPZp9fOk6YDMQR2Gg9jLQQ';

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase URL or Anon Key is missing. Check your integration.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
