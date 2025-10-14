"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PenLine } from 'lucide-react';
import { useLetterData } from '../useLetterData';
import StepWrapper from './StepWrapper';
import { supabase } from '@/_lib/supabase';
import shortUUID from 'short-uuid';

export default function WriteStep() {
  const router = useRouter();
  const { letterData, updateLetterData } = useLetterData();
  const [content, setContent] = useState(letterData.content);
  const [senderName, setSenderName] = useState(letterData.senderName);
  const [isNameSet, setIsNameSet] = useState(!!letterData.senderName);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  useEffect(() => {
    setContent(letterData.content);
    setSenderName(letterData.senderName);

    if (letterData.senderName) {
      setIsNameSet(true);
    } else {
      const storedName = localStorage.getItem('senderName');
      if (storedName) {
        setSenderName(storedName);
        setIsNameSet(true);
      } else {
        setIsNameSet(false);
      }
    }
  }, [letterData]);

  const handleNameSubmit = () => {
    if (senderName.trim()) {
      localStorage.setItem('senderName', senderName);
      updateLetterData({ senderName });
      setIsNameSet(true);
      setIsEditingName(false);
    }
  };

  const handleSave = async () => {
    if (!content.trim()) return;
    setSaveStatus('saving');
    setIsSaving(true);

    updateLetterData({ content, senderName });

    let error;

    if (letterData.shareCode) {
      const { error: updateError } = await supabase
        .from('letters')
        .update({ content, sender_name: senderName })
        .eq('share_code', letterData.shareCode);
      error = updateError;
    } else {
      const newShareCode = shortUUID.generate();
      const newManagementToken = shortUUID.generate();
      const { data, error: insertError } = await supabase
        .from('letters')
        .insert({
          content,
          sender_name: senderName,
          share_code: newShareCode,
          management_token: newManagementToken,
        })
        .select()
        .single();

      if (data) {
        updateLetterData({ shareCode: data.share_code, management_token: data.management_token });
        localStorage.setItem('unfinalizedShareCode', data.share_code);
      }
      error = insertError;
    }

    if (error) {
      console.error('Error saving letter:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 2000);
      setIsSaving(false);
      return false;
    }

    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
    setIsSaving(false);
    return true;
  };

  const handleNext = async () => {
    const savedSuccessfully = await handleSave();
    if (savedSuccessfully) {
      const navigateTo = letterData.shareCode ? `/edit/${letterData.shareCode}/voice` : `/create/voice`;
      router.push(navigateTo);
    }
  };

  const handleDiscard = async () => {
    if (!letterData.shareCode) return;

    const confirmed = window.confirm('Are you sure you want to discard this draft? This action cannot be undone.');
    if (!confirmed) return;

    try {
      // Delete audio file from storage if it exists
      if (letterData.audioUrl) {
        const fileName = letterData.audioUrl.split('/').pop();
        if (fileName) {
          const { error: storageError } = await supabase.storage.from('voice-recordings').remove([fileName]);
          if (storageError) console.error('Error deleting audio file:', storageError);
        }
      }

      // Delete the letter from the database
      const { error: dbError } = await supabase.from('letters').delete().eq('share_code', letterData.shareCode);
      if (dbError) throw dbError;

      // Clear local storage and reset state
      localStorage.removeItem('unfinalizedShareCode');
      updateLetterData({
        shareCode: null,
        content: '',
        senderName: '',
        audioBlob: null,
        audioUrl: null,
        musicId: null,
        finalized_at: null,
        management_token: null,
      });
      router.replace('/');

    } catch (error) {
      console.error('Error discarding draft:', error);
      alert('Could not discard the draft. Please try again.');
    }
  };

  return (
    <StepWrapper
      title="Write Your Letter"
      description="Express your feelings, share your thoughts, or simply say hello"
      icon={<PenLine className="w-8 h-8 text-btn-primary" />}
      buttonText={isSaving ? 'Saving...' : 'Next Step'}
      onNext={handleNext}
      isNextDisabled={!content.trim() || isSaving}
    >

      <div className="bg-secondary-bg shadow-xl px-4 py-8 md:p-12 relative">
        {!isNameSet ? (
          <div className="mb-6">
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
            <button
              onClick={handleNameSubmit}
              className="mt-4 px-6 py-2 bg-btn-primary text-white rounded hover:bg-btn-hover"
            >
              Save Name
            </button>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <div className="flex justify-between items-center mb-2">
                {isEditingName ? (
                  <input
                    type="text"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleNameSubmit();
                      }
                    }}
                    onBlur={handleNameSubmit}
                    autoFocus
                    className="w-full max-w-xs px-2 py-1 bg-primary-bg text-primary border border-secondary rounded-md focus:ring-2 focus:ring-btn-primary focus:border-transparent focus:outline-none transition-all"
                  />
                ) : (
                  <p className="text-primary" onClick={() => setIsEditingName(true)}>
                    From: <span className="font-bold cursor-pointer">{senderName}</span>
                  </p>
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
              <textarea
                id="letterContent"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Dear friend,&#10;&#10;I wanted to tell you..."
                rows={12}
                className="w-full px-4 py-3 bg-primary-bg text-primary border border-secondary rounded-md focus:ring-2 focus:ring-btn-primary focus:border-transparent focus:outline-none transition-all resize-none font-serif text-lg"
              />
              <div className="flex justify-between">
              <p className="mt-2 text-sm text-secondary">
                {content.split(/\s+/).filter(Boolean).length} words
              </p>
                {letterData.shareCode && (
          
            <button
              onClick={handleDiscard}
              className="text-sm text-red-400 hover:underline"
            >
              Discard
            </button>
          
        )}
                </div>
            </div>
          </>
        )}
        
      </div>
    </StepWrapper>
  );
}
