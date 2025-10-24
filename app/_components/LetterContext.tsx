"use client";

import { createContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useSupabase } from './SupabaseProvider';

export type LetterData = {
  id: string | null;
  shareCode: string | null;
  content: string;
  senderName: string;
  recipientName: string;
  musicUrl: string | null;
  musicVolume: number;
  finalized_at: string | null;
  management_token: string | null;
  temp_id: string | null;
};

interface LetterContextType {
  letterData: LetterData;
  updateLetterData: (data: Partial<LetterData>) => void;
  loading: boolean;
}

export const LetterContext = createContext<LetterContextType | undefined>(undefined);

const initialLetterData: LetterData = {
  id: null,
  shareCode: null,
  content: '',
  senderName: '',
  recipientName: '',
  musicUrl: null,
  musicVolume: 0.5,
  finalized_at: null,
  management_token: null,
  temp_id: null,
};

export const LetterProvider = ({ children, shareCode }: { children: ReactNode, shareCode?: string }) => {
  const supabase = useSupabase();
  const [letterData, setLetterData] = useState<LetterData>(initialLetterData);
  const [loading, setLoading] = useState(true);

  // Safely load from localStorage only on the client side
  useEffect(() => {
    try {
      const savedData = localStorage.getItem('letterData');
      if (savedData && savedData !== 'undefined') {
        const parsed = JSON.parse(savedData);
        // If we're on a page for a specific letter, but the data in storage is for a different one, reset.
        if (shareCode && parsed.shareCode && parsed.shareCode !== shareCode) {
          localStorage.removeItem('letterData');
          setLetterData(initialLetterData);
        } else {
          setLetterData(parsed);
        }
      }
    } catch (error) {
      console.error('Error reading from localStorage', error);
      setLetterData(initialLetterData);
    }
    setLoading(false);
  }, [shareCode]); // Only run this when the shareCode from the URL changes

  // Persist to localStorage whenever letterData changes
  useEffect(() => {
    try {
      localStorage.setItem('letterData', JSON.stringify(letterData));
    } catch (error) {
      console.error('Error writing to localStorage', error);
    }
  }, [letterData]);

  const updateLetterData = useCallback((data: Partial<LetterData>) => {
    if (data.shareCode === null) {
      // If we are explicitly clearing the letter (e.g., discarding or finalizing),
      // remove it from local storage and reset the state to initial.
      localStorage.removeItem('letterData');
      setLetterData(initialLetterData);
    } else {
      setLetterData((prev) => ({ ...prev, ...data }));
    }
  }, []);

  return (
    <LetterContext.Provider value={{ letterData, updateLetterData, loading }}>
      {children}
    </LetterContext.Provider>
  );
};