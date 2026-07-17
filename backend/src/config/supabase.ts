import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load the environment variables from your .env.development file
dotenv.config({ path: '.env.development' });

const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

// A safety check so the server crashes immediately if you forgot your keys
if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase credentials in .env.development!');
}

// Create and export the database connection
export const supabase = createClient(supabaseUrl, supabaseKey);