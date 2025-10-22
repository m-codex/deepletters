export type Letter = {
  id:string;
  content: string | null;
  theme: 'light' | 'dark';
  music_url: string | null;
  music_volume: number | null;
  share_code: string;
  management_token: string | null;
  sender_name: string | null;
  recipient_name: string | null;
  subject: string | null;
  sender_id: string | null;
  created_at: string;
  view_count: number;
  finalized_at: string | null;
  status: 'draft' | 'finalized';
};

export interface LetterWithSubject extends Letter {
  user_subject?: string;
}
