"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PenLine, Sun, Moon } from 'lucide-react';
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
    setSaveStatus('saving');
    setIsSaving(true);
    updateLetterData({ content, senderName });

    // Only interact with the database to get a share code if one doesn't exist.
    // The actual content is not saved here anymore.
    if (!letterData.shareCode) {
      // The share_code is generated using short-uuid, which has a very low probability of collisions.
      // For this application's scale, it's considered unique enough.
      const newShareCode = shortUUID.generate();
      const { data, error } = await supabase
        .from('letters')
        .insert({
          share_code: newShareCode,
          sender_name: senderName, // Save sender name for identification
          theme: letterData.theme,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating letter entry:', error);
        setSaveStatus('error');
        setIsSaving(false);
        return false;
      }

      if (data) {
        updateLetterData({ shareCode: data.share_code, management_token: data.management_token });
        localStorage.setItem('unfinalizedShareCode', data.share_code);
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
    if (!letterData.shareCode) return;

    const confirmed = window.confirm('Are you sure you want to discard this draft? This action cannot be undone.');
    if (!confirmed) return;

    try {
      // Only delete the record from the database.
      // No need to delete from storage as nothing is uploaded until finalization.
      const { error: dbError } = await supabase.from('letters').delete().eq('share_code', letterData.shareCode);
      if (dbError) throw dbError;

      // Clear local storage and reset state
      localStorage.removeItem('unfinalizedShareCode');
      updateLetterData({
        shareCode: null,
        content: '',
        senderName: '',
        musicUrl: null,
        musicVolume: 0.5,
        finalized_at: null,
        management_token: null,
      });
      router.replace('/');

    } catch (error) {
      console.error('Error discarding draft:', error);
      alert('Could not discard the draft. Please try again.');
    }
  };

  const toggleTheme = () => {
    updateLetterData({ theme: letterData.theme === 'light' ? 'dark' : 'light' });
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
    <form
      onSubmit={(e) => {
        // Prevent default form submission (page reload)
        e.preventDefault();
        handleNameSubmit();
      }}
      className="mb-6"
    >
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
            // Setting type="submit" allows Enter key to trigger the form's onSubmit handler
            type="submit"
            className="mt-4 px-6 py-2 bg-btn-primary text-white rounded hover:bg-btn-hover"
        >
            Save Name
        </button>
    </form>
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
                        From: <span className="cursor-pointer">{senderName}</span>
                    </p>
                )}
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
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Dear friend,&#10;&#10;I wanted to tell you..."
                rows={12}
                className={`w-full px-4 py-5 sm:px-8 sm:py-8 md:px-12 md:py-8 ${
                    letterData.theme === 'light' ? 'bg-primary-bg text-primary' : 'bg-primary text-primary-bg'
                } rounded-md focus:ring-2 focus:ring-btn-primary focus:border-transparent focus:outline-none transition-all resize-none font-serif text-lg`}
            />
            <div className="flex justify-between items-center">
                <p className="text-sm text-secondary">{content.split(/\s+/).filter(Boolean).length} words</p>
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
