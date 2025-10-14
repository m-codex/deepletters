"use client";

import { useContext } from 'react';
import { LetterContext } from './LetterContext';

export const useLetterData = () => {
  const context = useContext(LetterContext);
  if (!context) {
    throw new Error('useLetterData must be used within a LetterProvider');
  }
  return context;
};
