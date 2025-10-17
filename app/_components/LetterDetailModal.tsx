"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/_lib/supabase';
import { X, Save } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { LetterWithSubject } from '@/_lib/supabase';

interface LetterDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  letter: LetterWithSubject | null;
  user: User | null;
  onSubjectUpdate: (letterId: string, newSubject: string) => void;
}

export default function LetterDetailModal({
  isOpen,
  onClose,
  letter,
  user,
  onSubjectUpdate,
}: LetterDetailModalProps) {
  const [subject, setSubject] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (letter) {
      setSubject(letter.user_subject || '');
    }
  }, [letter]);

  if (!isOpen || !letter || !user) return null;

  const handleSubjectSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase.from('user_letter_subjects').upsert({
        user_id: user.id,
        letter_id: letter.id,
        subject: subject,
      });
      if (error) throw error;
      onSubjectUpdate(letter.id, subject);
      alert('Subject saved!');
    } catch (err) {
      console.error('Error saving subject:', err);
      alert('Failed to save subject.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4">
      <div className="bg-secondary-bg rounded-lg shadow-2xl p-8 max-w-2xl w-full relative animate-fadeInUp flex flex-col max-h-[90vh]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-secondary hover:text-primary transition-colors"
          aria-label="Close modal"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-2xl font-bold text-primary mb-4">Letter from {letter.sender_name}</h2>

        <div className="mb-6">
          <label htmlFor="personal-subject" className="block text-sm font-medium text-secondary mb-2">
            Your Personal Subject
          </label>
          <div className="flex gap-2">
            <input
              id="personal-subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g., 'Birthday thoughts' or 'Project ideas'"
              className="flex-grow w-full px-4 py-2 bg-primary-bg text-primary border border-secondary rounded-md focus:ring-2 focus:ring-btn-primary"
            />
            <button
              onClick={handleSubjectSave}
              disabled={isSaving}
              className="px-4 py-2 bg-btn-primary text-white rounded-md hover:bg-btn-hover disabled:bg-gray-400 flex items-center gap-2"
            >
              <Save className="w-5 h-5" />
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        <div className="flex-grow overflow-y-auto p-6 bg-primary-bg rounded-md">
          <p className="whitespace-pre-wrap font-serif text-lg text-primary">{letter.content}</p>
        </div>
      </div>
      <style jsx>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeInUp { animation: fadeInUp 0.3s ease-out; }
      `}</style>
    </div>
  );
}