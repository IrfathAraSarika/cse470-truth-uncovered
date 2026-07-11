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

// The ONLY place SQL/Supabase queries for signup should live

export async function findCitizenByEmail(email: string): Promise<Citizen | null> {
  const { data, error } = await supabase
    .from('citizens')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function createCitizen(
  fullName: string,
  email: string,
  passwordHash: string
): Promise<Citizen> {
  const { data, error } = await supabase
    .from('citizens')
    .insert({ fullName, email, passwordHash, isVerified: false })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}