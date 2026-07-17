import { supabase } from '../config/supabase.js';

// Defining the exact shape of the data based on your schema image
export interface ReportPayload {
  citizen_id: string; // Foreign Key (Non-nullable)
  location_id?: string | null; // Foreign Key (Nullable)
  institution_id?: string | null; // Foreign Key (Nullable)
  title: string;
  description: string;
  category: string; // Will map to your report_category Enum
  incident_datetime?: string | null;
  is_anonymous: boolean;
}

export const insertReport = async (payload: ReportPayload) => {
  const { data, error } = await supabase
    .from('reports')
    .insert([{
      citizen_id: payload.citizen_id,
      location_id: payload.location_id || null,
      institution_id: payload.institution_id || null,
      title: payload.title,
      description: payload.description,
      category: payload.category,
      incident_datetime: payload.incident_datetime || null,
      is_anonymous: payload.is_anonymous,
      status: 'pending', // Default status for new reports
      submission_date: new Date().toISOString()
    }])
    .select();

  if (error) {
    console.error("Database Error:", error);
    throw new Error(error.message);
  }

  return data;
};