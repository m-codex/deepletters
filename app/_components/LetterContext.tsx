"use client";

import { createContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { supabase } from '@/_lib/supabase';

export type LetterData = {
  shareCode: string | null;
  content: string;
  senderName: string;
  audioBlob: Blob | null;
  audioUrl: string | null;
  musicId: string | null;
  finalized_at: string | null;
  management_token: string | null;
};

interface LetterContextType {
  letterData: LetterData;
  updateLetterData: (data: Partial<LetterData>) => void;
  loading: boolean;
}

export const LetterContext = createContext<LetterContextType | undefined>(undefined);

export const LetterProvider = ({ children, shareCode }: { children: ReactNode, shareCode?: string }) => {
  const [letterData, setLetterData] = useState<LetterData>({
    shareCode: null,
    content: '',
    senderName: '',
    audioBlob: null,
    audioUrl: null,
    musicId: null,
    finalized_at: null,
    management_token: null,
  });
  const [loading, setLoading] = useState(!!shareCode);

  useEffect(() => {
    const loadLetter = async (code: string) => {
      setLoading(true);
      const { data, error } = await supabase
        .from('letters')
        .select('*')
        .eq('share_code', code)
        .maybeSingle();

      if (data) {
        setLetterData({
          shareCode: data.share_code,
          content: data.content,
          senderName: data.sender_name || '',
          musicId: data.music_id,
          audioUrl: data.audio_url,
          audioBlob: null, // Blob is loaded from audioUrl in VoiceStep if needed
          finalized_at: data.finalized_at,
          management_token: data.management_token,
        });
      } else if (error) {
        console.error('Error loading letter:', error);
      }
      setLoading(false);
    };

    if (shareCode) {
      loadLetter(shareCode);
    } else {
      const unfinalizedShareCode = localStorage.getItem('unfinalizedShareCode');
      if (unfinalizedShareCode) {
        loadLetter(unfinalizedShareCode);
      }
    }
  }, [shareCode]);

  const updateLetterData = useCallback((data: Partial<LetterData>) => {
    setLetterData((prev) => ({ ...prev, ...data }));
  }, []);

  return (
    <LetterContext.Provider value={{ letterData, updateLetterData, loading }}>
      {children}
    </LetterContext.Provider>
  );
};
