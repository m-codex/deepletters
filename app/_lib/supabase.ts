import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Letter = {
  id:string;
  content: string | null;
  theme: 'light' | 'dark';
  music_url: string | null;
  music_volume: number | null;
  share_code: string;
  management_token: string | null;
  sender_name: string | null;
  created_at: string;
  view_count: number;
  finalized_at: string | null;
};

export interface LetterWithSubject extends Letter {
  user_subject?: string;
  recipient_name?: string;
  subject?: string;
}
