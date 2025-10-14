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

const initialLetterData: LetterData = {
  shareCode: null,
  content: '',
  senderName: '',
  audioBlob: null,
  audioUrl: null,
  musicId: null,
  finalized_at: null,
  management_token: null,
};

export const LetterProvider = ({ children, shareCode }: { children: ReactNode, shareCode?: string }) => {
  const [letterData, setLetterData] = useState<LetterData>(() => {
    if (typeof window === 'undefined') {
      return initialLetterData;
    }
    try {
      const savedData = localStorage.getItem('letterData');
      if (savedData && savedData !== 'undefined') {
        const parsed = JSON.parse(savedData);
        if (shareCode && parsed.shareCode && parsed.shareCode !== shareCode) {
          localStorage.removeItem('letterData');
          return initialLetterData;
        }
        return { ...parsed, audioBlob: null };
      }
    } catch (error) {
      console.error('Error reading from localStorage', error);
    }
    return initialLetterData;
  });

  const [loading, setLoading] = useState(!!shareCode && letterData.shareCode !== shareCode);

  useEffect(() => {
    try {
      const { audioBlob, ...persistableData } = letterData;
      localStorage.setItem('letterData', JSON.stringify(persistableData));
    } catch (error) {
      console.error('Error writing to localStorage', error);
    }
  }, [letterData]);

  useEffect(() => {
    const loadLetter = async (code: string) => {
      setLoading(true);
      const { data, error } = await supabase
        .from('letters')
        .select('*')
        .eq('share_code', code)
        .maybeSingle();

      if (data) {
        setLetterData(prev => ({
          ...prev,
          shareCode: data.share_code,
          content: data.content,
          senderName: data.sender_name || '',
          musicId: data.music_id,
          audioUrl: data.audio_url,
          finalized_at: data.finalized_at,
          management_token: data.management_token,
        }));
      } else if (error) {
        console.error('Error loading letter:', error);
      }
      setLoading(false);
    };

    if (shareCode && shareCode !== letterData.shareCode) {
      loadLetter(shareCode);
    }
  }, [shareCode, letterData.shareCode]);

  const updateLetterData = useCallback((data: Partial<LetterData>) => {
    setLetterData((prev) => ({ ...prev, ...data }));
  }, []);

  return (
    <LetterContext.Provider value={{ letterData, updateLetterData, loading }}>
      {children}
    </LetterContext.Provider>
  );
};
