import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Letter = {
  id: string;
  content: string;
  theme_id: string;
  music_id: string | null;
  audio_url: string | null;
  share_code: string;
  management_token: string | null;
  sender_name: string | null;
  is_permanent: boolean;
  upgraded_by: string | null;
  created_at: string;
  expires_at: string | null;
  view_count: number;
  finalized_at: string | null;
  is_paid: boolean;
  storage_path: string | null;
};

export type Theme = {
  id: string;
  name: string;
  description: string;
  preview_image: string;
  styles: {
    background: string;
    text: string;
    accent: string;
    font: string;
    animation: string;
  };
  is_active: boolean;
};

export type MusicTrack = {
  id: string;
  name: string;
  artist: string;
  url: string;
  duration: number;
  is_active: boolean;
};
