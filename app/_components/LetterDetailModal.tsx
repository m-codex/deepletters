"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Save, Eye, Plus } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { LetterWithSubject } from '@/_lib/supabase';
import { useSupabase } from './SupabaseProvider';

interface LetterDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  letter: LetterWithSubject | null;
  user: User | null;
  onSubjectUpdate: (letterId: string, newSubject: string) => void;
  folders: { id: string; name: string }[];
  onNewFolder: (folderName: string) => Promise<{ id: string; name: string } | null>;
  onSubjectSave: (letterId: string, subject: string, userId: string) => Promise<void>;
  onFolderAssign: (letterId: string, folderId: string | null) => Promise<void>;
}

export default function LetterDetailModal({
  isOpen,
  onClose,
  letter,
  user,
  onSubjectUpdate,
  folders,
  onNewFolder,
  onSubjectSave,
  onFolderAssign,
}: LetterDetailModalProps) {
  const supabase = useSupabase();
  const router = useRouter();
  const [subject, setSubject] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  useEffect(() => {
    if (letter) {
      setSubject(letter.user_subject || letter.subject || '');
      const fetchInitialFolder = async () => {
        const { data } = await supabase
          .from('folder_letters')
          .select('folder_id')
          .eq('letter_id', letter.id)
          .single();
        if (data) {
          setSelectedFolder(data.folder_id);
        } else {
          setSelectedFolder(null);
        }
      };
      fetchInitialFolder();
    }
  }, [letter, supabase]);

  if (!isOpen || !letter || !user) return null;

  const handleSaveAndClose = async () => {
    if (!letter || !user) return;
    setIsSaving(true);
    try {
      await onSubjectSave(letter.id, subject, user.id);
      await onFolderAssign(letter.id, selectedFolder);
    } catch (error) {
      console.error('Error saving details:', error);
      // Optionally, show an error message to the user
    } finally {
      setIsSaving(false);
      onClose();
    }
  };

  const handleFolderChange = (folderId: string | null) => {
    setSelectedFolder(folderId);
    onFolderAssign(letter.id, folderId);
  };

  const handleCreateFolder = async () => {
    if (newFolderName.trim() === '') return;
    const newFolder = await onNewFolder(newFolderName.trim());
    if (newFolder) {
      setSelectedFolder(newFolder.id);
      onFolderAssign(letter.id, newFolder.id);
      setNewFolderName('');
      setIsCreatingFolder(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4">
      <div className="bg-secondary-bg rounded-lg shadow-2xl p-8 max-w-2xl w-full relative animate-fadeInUp flex flex-col max-h-[90vh]">
        <button
          onClick={handleSaveAndClose}
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
          </div>
        </div>

        <div className="mb-6">
          <label htmlFor="folder-select" className="block text-sm font-medium text-secondary mb-2">
            Assign to Folder
          </label>
          <div className="flex gap-2">
            <select
              id="folder-select"
              value={selectedFolder || ''}
              onChange={(e) => handleFolderChange(e.target.value || null)}
              className="flex-grow w-full px-4 py-2 bg-primary-bg text-primary border border-secondary rounded-md"
            >
              <option value="">No folder</option>
              {folders.map(folder => (
                <option key={folder.id} value={folder.id}>{folder.name}</option>
              ))}
            </select>
            <button onClick={() => setIsCreatingFolder(true)} className="p-2 bg-btn-secondary text-primary-bg rounded-md hover:bg-btn-hover">
              <Plus className="w-5 h-5" />
            </button>
          </div>
          {isCreatingFolder && (
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="New folder name"
                className="flex-grow w-full px-4 py-2 bg-primary-bg text-primary border border-secondary rounded-md"
              />
              <button onClick={handleCreateFolder} className="px-4 py-2 bg-btn-primary text-white rounded-md hover:bg-btn-hover">Create</button>
              <button onClick={() => setIsCreatingFolder(false)} className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600">Cancel</button>
            </div>
          )}
        </div>

        <div className="flex-grow overflow-y-auto p-6 bg-primary-bg rounded-md">
          <p className="whitespace-pre-wrap font-serif text-lg text-primary">{letter.content}</p>
        </div>

        <div className="mt-6 flex justify-end gap-4">
          <button
            onClick={() => router.push(`/letter/${letter.share_code}`)}
            className="px-6 py-2 bg-btn-primary text-white rounded-md hover:bg-btn-hover flex items-center gap-2"
          >
            <Eye className="w-5 h-5" />
            View Letter
          </button>
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
