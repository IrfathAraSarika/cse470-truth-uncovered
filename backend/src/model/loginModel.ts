import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface Citizen {
  userID: string;
  fullName: string;
  email: string;
  passwordHash: string;
  isVerified: boolean;
}

// The ONLY place SQL/Supabase queries for login should live

export async function findCitizenByEmail(email: string): Promise<Citizen | null> {
  const { data, error } = await supabase
    .from('citizens')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}