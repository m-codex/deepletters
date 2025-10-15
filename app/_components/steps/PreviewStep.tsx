"use client";

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLetterData } from '../useLetterData';
import { MailCheck, Play, Pause } from 'lucide-react';
import StepWrapper from './StepWrapper';
import { supabase, Letter } from '@/_lib/supabase';
import shortUUID from 'short-uuid';
import {
  generateEncryptionKey,
  exportKeyToString,
  encryptData,
} from '@/_lib/crypto';

export default function PreviewStep() {
  const router = useRouter();
  const { letterData, updateLetterData } = useLetterData();
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const voiceAudioRef = useRef<HTMLAudioElement>(null);
  const musicAudioRef = useRef<HTMLAudioElement>(null);

  const togglePlayPause = () => {
    const voiceAudio = voiceAudioRef.current;
    const musicAudio = musicAudioRef.current;

    if (isPlaying) {
      voiceAudio?.pause();
      musicAudio?.pause();
      setIsPlaying(false);
    } else {
      voiceAudio?.play();
      musicAudio?.play();
      setIsPlaying(true);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const volume = parseFloat(e.target.value);
    updateLetterData({ musicVolume: volume });
  };

  useEffect(() => {
    if (musicAudioRef.current) {
      musicAudioRef.current.volume = letterData.musicVolume;
    }
  }, [letterData.musicVolume]);

  const handleOnEnded = () => {
    setIsPlaying(false);
    if (musicAudioRef.current) {
        musicAudioRef.current.pause();
        musicAudioRef.current.currentTime = 0;
    }
  }

  const handleEdit = () => {
    router.push('/create/write');
  };

  const handleFinalize = async () => {
    if (!letterData.shareCode) {
      alert('Cannot finalize without a share code.');
      return;
    }
    setIsLoading(true);

    try {
      // 1. Generate and export key
      const encryptionKey = await generateEncryptionKey();
      const exportedKey = await exportKeyToString(encryptionKey);

      // 2. Prepare data for encryption
      let audioDataUrl: string | null = null;
      if (letterData.audioBlob) {
        const audioBlob = letterData.audioBlob;
        audioDataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(audioBlob);
        });
      }

      const dataToEncrypt = {
        content: letterData.content,
        audioDataUrl: audioDataUrl,
        senderName: letterData.senderName,
        musicUrl: letterData.musicUrl,
        musicVolume: letterData.musicVolume,
      };

      // 3. Encrypt the data
      const jsonString = JSON.stringify(dataToEncrypt);
      const dataBuffer = new TextEncoder().encode(jsonString);
      const encryptedBuffer = await encryptData(encryptionKey, dataBuffer);

      // 4. Upload the encrypted file
      const encryptedFile = new Blob([encryptedBuffer], { type: 'application/octet-stream' });
      const filePath = `${letterData.shareCode}`;

      const { error: uploadError } = await supabase.storage
        .from('encrypted-letters')
        .upload(filePath, encryptedFile, { upsert: true });

      if (uploadError) throw uploadError;

      // 5. Update the database record
      const finalizedAt = new Date().toISOString();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      const managementToken = shortUUID.generate();

      const updateData: Partial<Letter> = {
        finalized_at: finalizedAt,
        expires_at: expiresAt.toISOString(),
        management_token: managementToken,
        storage_path: filePath,
        theme: letterData.theme,
        // content and audio_url are no longer stored directly
      };

      const { error: updateError } = await supabase
        .from('letters')
        .update(updateData)
        .eq('share_code', letterData.shareCode);

      if (updateError) throw updateError;

      // 6. Redirect the user
      if (letterData.shareCode) {
        localStorage.removeItem('unfinalizedShareCode');
        localStorage.setItem('lastFinalizedShareCode', letterData.shareCode);
      }
      router.replace(`/manage/${managementToken}?key=${exportedKey}`);

    } catch (error) {
      console.error('Error finalizing letter:', error);
      alert('Could not finalize your letter. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <StepWrapper
      title="Preview Your Letter"
      description="This is how your letter will appear to the recipient."
      icon={<MailCheck className="w-8 h-8 text-btn-primary" />}
      buttonText={isLoading ? 'Finalizing...' : 'Finalize & Share'}
      onNext={handleFinalize}
      isNextDisabled={isLoading}
      secondaryButtonText="Edit Letter"
      onSecondaryClick={handleEdit}
    >
      <div
        className={`px-4 py-3 sm:px-8 sm:py-5 md:px-12 md:py-8 pt-12 shadow-xl mb-8 relative rounded-lg ${
          letterData.theme === 'light' ? 'bg-secondary-bg' : 'bg-primary'
        }`}
      >
        <div className="absolute top-4 right-4 bg-btn-secondary text-primary-bg px-4 py-1 rounded-full text-sm font-bold">
          PREVIEW MODE
        </div>

        {letterData.audioUrl && (
          <audio
            ref={voiceAudioRef}
            src={letterData.audioUrl}
            onEnded={handleOnEnded}
          />
        )}
        {letterData.musicUrl && (
          <audio
            ref={musicAudioRef}
            src={letterData.musicUrl}
            loop
          />
        )}

        <div className="flex items-center gap-4 mb-6">
          {(letterData.audioUrl || letterData.musicUrl) && (
            <button
              onClick={togglePlayPause}
              className="flex items-center gap-2 bg-btn-primary text-white font-bold py-2 px-4 rounded-lg hover:shadow-lg transition-all"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              <span>{isPlaying ? 'Pause' : 'Play'}</span>
            </button>
          )}

          {letterData.musicUrl && (
            <div className="flex items-center gap-2">
              <label htmlFor="volume" className="text-sm text-secondary">Music Volume</label>
              <input
                type="range"
                id="volume"
                min="0"
                max="1"
                step="0.05"
                value={letterData.musicVolume}
                onChange={handleVolumeChange}
                className="w-32"
              />
            </div>
          )}
        </div>

        <div className={`prose prose-lg max-w-none ${
          letterData.theme === 'light' ? 'text-primary' : 'text-primary-bg'
        }`}>
          <p
            className="whitespace-pre-wrap leading-relaxed"
          >
            {letterData.content}
          </p>
        </div>

      </div>
    </StepWrapper>
  );
}
