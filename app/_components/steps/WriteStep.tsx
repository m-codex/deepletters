"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PenLine, Sun, Moon } from 'lucide-react';
import { useLetterData } from '../useLetterData';
import StepWrapper from './StepWrapper';
import { useSupabase } from '../SupabaseProvider';
import shortUUID from 'short-uuid';
import type { User } from '@supabase/supabase-js';

export default function WriteStep() {
  const router = useRouter();
  const { letterData, updateLetterData } = useLetterData();
  const supabase = useSupabase();
  const [user, setUser] = useState<User | null>(null);
  const [senderName, setSenderName] = useState(letterData.senderName);
  const [recipientName, setRecipientName] = useState(letterData.recipientName);
  const [isNameSet, setIsNameSet] = useState(!!letterData.senderName);
  const [isRecipientNameSet, setIsRecipientNameSet] = useState(!!letterData.recipientName);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingRecipientName, setIsEditingRecipientName] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  useEffect(() => {
    // Pre-fill sender name from localStorage as a default.
    const storedSenderName = localStorage.getItem('senderName');
    if (storedSenderName) {
      setSenderName(storedSenderName);
    }

    // If there's data from the context (i.e., an active draft), use that.
    // The visibility of the form is also controlled by the context data.
    if (letterData.senderName && letterData.recipientName) {
      setSenderName(letterData.senderName);
      setRecipientName(letterData.recipientName);
      setIsNameSet(true);
      setIsRecipientNameSet(true);
    } else {
      // For a new letter, recipient name should be blank, and form should be visible.
      setRecipientName('');
      setIsNameSet(false);
      setIsRecipientNameSet(false);
    }
  }, [letterData]);

  useEffect(() => {
    // Generate a temporary ID for anonymous users to link their letter after registration
    const tempId = localStorage.getItem('temp_id');
    if (!tempId) {
      const newTempId = crypto.randomUUID();
      localStorage.setItem('temp_id', newTempId);
      updateLetterData({ temp_id: newTempId });
    } else {
      updateLetterData({ temp_id: tempId });
    }

    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
      }
    };
    checkUser();
  }, [updateLetterData, supabase.auth]);

  const handleNameSubmit = () => {
    if (senderName.trim() && recipientName.trim()) {
      localStorage.setItem('senderName', senderName);
      localStorage.setItem('recipientName', recipientName);
      updateLetterData({ senderName, recipientName });
      setIsNameSet(true);
      setIsRecipientNameSet(true);
      setIsEditingName(false);
    }
  };

  const handleSenderNameSubmit = () => {
    if (senderName.trim()) {
      localStorage.setItem('senderName', senderName);
      updateLetterData({ senderName });
      setIsEditingName(false);
    }
  };

  const handleRecipientNameSubmit = () => {
    if (recipientName.trim()) {
      localStorage.setItem('recipientName', recipientName);
      updateLetterData({ recipientName });
      setIsEditingRecipientName(false);
    }
  };

  const handleSave = async () => {
    setSaveStatus('saving');
    setIsSaving(true);
    updateLetterData({ senderName, recipientName });

    if (user) {
      // Logged-in user: save draft to the database
      const letterPayload = {
        content: letterData.content,
        sender_name: senderName,
        recipient_name: recipientName,
        theme: letterData.theme,
        sender_id: user.id,
        status: 'draft',
      };

      let result;
      if (letterData.id) {
        // Update existing draft
        result = await supabase
          .from('letters')
          .update(letterPayload)
          .eq('id', letterData.id)
          .select()
          .single();
      } else {
        // Create new draft
        result = await supabase
          .from('letters')
          .insert(letterPayload)
          .select()
          .single();
      }

      const { data, error } = result;

      if (error) {
        console.error('Error saving draft:', error);
        setSaveStatus('error');
        setIsSaving(false);
        return false;
      }

      if (data) {
        updateLetterData({ id: data.id });
      }
    }

    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
    setIsSaving(false);
    return true;
  };

  const handleNext = async () => {
    await handleSave();
    router.push('/create/music');
  };

  const handleDiscard = async () => {
    const confirmed = window.confirm('Are you sure you want to discard this draft? This action cannot be undone.');
    if (!confirmed) return;

    if (user && letterData.id) {
      // Logged-in user: delete draft from the database
      try {
        const { error } = await supabase.from('letters').delete().eq('id', letterData.id);
        if (error) throw error;
      } catch (error) {
        console.error('Error discarding draft:', error);
        alert('Could not discard the draft. Please try again.');
        return;
      }
    }

    // Clear data from context and localStorage
    updateLetterData({
      id: null,
      shareCode: null,
      content: '',
      senderName: '',
      recipientName: '',
      theme: 'light',
      musicUrl: null,
      management_token: null,
      temp_id: null,
    });
    localStorage.removeItem('letterData');
    setRecipientName('');
    setIsRecipientNameSet(false);
  };

  const toggleTheme = () => {
    updateLetterData({ theme: letterData.theme === 'light' ? 'dark' : 'light' });
  };

  return (
    <StepWrapper
      title="Write Your Letter"
      description="Express your feelings, share your thoughts, or simply say hello"
      icon={<PenLine className="w-8 h-8 text-accent" />}
      buttonText={isSaving ? 'Saving...' : 'Next Step'}
      onNext={handleNext}
      isNextDisabled={!letterData.content.trim() || isSaving}
    >
      <div className="bg-secondary-bg shadow-xl px-4 py-8 md:p-12 relative">
        {!isNameSet || !isRecipientNameSet ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleNameSubmit();
            }}
            className="mb-6"
          >
            <div className="mb-4">
              <label htmlFor="senderName" className="block text-sm text-secondary mb-2">
                Your Name
              </label>
              <input
                id="senderName"
                type="text"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="Name"
                className="w-full px-4 py-3 bg-primary-bg text-primary border border-secondary rounded-md focus:ring-2 focus:ring-btn-primary focus:border-transparent focus:outline-none transition-all"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="recipientName" className="block text-sm text-secondary mb-2">
                Recipient&apos;s Name
              </label>
              <input
                id="recipientName"
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="Name"
                className="w-full px-4 py-3 bg-primary-bg text-primary border border-secondary rounded-md focus:ring-2 focus:ring-btn-primary focus:border-transparent focus:outline-none transition-all"
              />
            </div>
            <button
              type="submit"
              className="mt-4 px-6 py-2 bg-btn-primary text-white rounded hover:bg-btn-hover"
            >
              Save Names
            </button>
          </form>
        ) : (
            <>
              <div className="mb-8">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    {isEditingName ? (
                      <input
                        type="text"
                        value={senderName}
                        onChange={(e) => setSenderName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleSenderNameSubmit();
                          }
                        }}
                        onBlur={handleSenderNameSubmit}
                        autoFocus
                        className="w-full max-w-xs px-2 py-1 bg-primary-bg text-primary border border-secondary rounded-md focus:ring-2 focus:ring-btn-primary focus:border-transparent focus:outline-none transition-all"
                      />
                    ) : (
                      <p className="text-primary" onClick={() => setIsEditingName(true)}>
                        From: <span className="cursor-pointer">{senderName}</span>
                      </p>
                    )}
                    {isEditingRecipientName ? (
                      <input
                        type="text"
                        value={recipientName}
                        onChange={(e) => setRecipientName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleRecipientNameSubmit();
                          }
                        }}
                        onBlur={handleRecipientNameSubmit}
                        autoFocus
                        className="w-full max-w-xs px-2 py-1 bg-primary-bg text-primary border border-secondary rounded-md focus:ring-2 focus:ring-btn-primary focus:border-transparent focus:outline-none transition-all"
                      />
                    ) : (
                      <p className="text-primary" onClick={() => setIsEditingRecipientName(true)}>
                        To: <span className="cursor-pointer">{recipientName}</span>
                      </p>
                    )}
                  </div>
                  <div className="flex gap-4">
                    {letterData.shareCode && (
                      <button
                        onClick={handleDiscard}
                        className="text-sm text-btn-primary hover:underline"
                      >
                        New
                      </button>
                    )}
                    <button
                      onClick={handleSave}
                      disabled={saveStatus === 'saving'}
                      className="px-4 py-1 text-sm bg-btn-primary text-white rounded hover:bg-btn-hover disabled:bg-gray-400 transition-colors"
                    >
                      {saveStatus === 'saving'
                        ? 'Saving...'
                        : saveStatus === 'saved'
                        ? 'Saved!'
                        : saveStatus === 'error'
                        ? 'Error!'
                        : 'Save'}
                    </button>
                  </div>
                </div>
                <textarea
                  id="letterContent"
                  value={letterData.content}
                  onChange={(e) => updateLetterData({ content: e.target.value })}
                  placeholder="Dear friend,&#10;&#10;I wanted to tell you..."
                  rows={12}
                  className="w-full px-4 py-5 sm:px-8 sm:py-8 md:px-12 md:py-8 bg-primary-bg text-primary rounded-md focus:ring-2 focus:ring-btn-primary focus:border-transparent focus:outline-none transition-all resize-none font-serif text-lg"
                />
                <div className="flex justify-between items-center">
                  <p className="text-sm text-secondary">{letterData.content.split(/\s+/).filter(Boolean).length} words</p>
                  <button
                    onClick={toggleTheme}
                    className="p-2 rounded-full hover:bg-secondary-bg"
                    aria-label="Toggle Theme"
                  >
                    {letterData.theme === 'light' ? (
                      <Sun className="w-5 h-5 text-secondary" />
                    ) : (
                      <Moon className="w-5 h-5 text-secondary" />
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
    </StepWrapper>
  );
}
