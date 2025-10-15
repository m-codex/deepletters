"use client";

import { createContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { supabase } from '@/_lib/supabase';

export type LetterData = {
  shareCode: string | null;
  content: string;
  senderName: string;
  audioBlob: Blob | null;
  audioUrl: string | null;
  musicUrl: string | null;
  musicVolume: number;
  finalized_at: string | null;
  management_token: string | null;
  theme: 'light' | 'dark';
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
  musicUrl: null,
  musicVolume: 0.5,
  finalized_at: null,
  management_token: null,
  theme: 'light',
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

  const updateLetterData = useCallback((data: Partial<LetterData>) => {
    setLetterData((prev) => ({ ...prev, ...data }));
  }, []);

  useEffect(() => {
    // If a shareCode is provided via URL, we fetch the *metadata*
    // but not the content, which will be loaded from local storage.
    const loadLetterMetadata = async (code: string) => {
      setLoading(true);
      const { data, error } = await supabase
        .from('letters')
        .select('share_code, sender_name, finalized_at, management_token')
        .eq('share_code', code)
        .maybeSingle();

      if (data) {
        // We only update the metadata fields, preserving the content
        // from local storage if the user is editing.
        updateLetterData({
          shareCode: data.share_code,
          senderName: data.sender_name || '',
          finalized_at: data.finalized_at,
          management_token: data.management_token,
        });
      } else if (error) {
        console.error('Error loading letter metadata:', error);
      }
      setLoading(false);
    };

    if (shareCode && shareCode !== letterData.shareCode) {
      loadLetterMetadata(shareCode);
    } else {
      setLoading(false);
    }
  }, [shareCode, letterData.shareCode, updateLetterData]);

  return (
    <LetterContext.Provider value={{ letterData, updateLetterData, loading }}>
      {children}
    </LetterContext.Provider>
  );
};
