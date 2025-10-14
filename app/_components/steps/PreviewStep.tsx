"use client";

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useLetterData } from '../useLetterData';
import { Eye, Play, Pause, Music } from 'lucide-react';
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
  const { letterData } = useLetterData();
  const [isLoading, setIsLoading] = useState(false);
  const [isVoicePlaying, setIsVoicePlaying] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);

  const voiceAudioRef = useRef<HTMLAudioElement>(null);
  const musicAudioRef = useRef<HTMLAudioElement>(null);

  const toggleVoice = () => {
    if (voiceAudioRef.current) {
      if (isVoicePlaying) {
        voiceAudioRef.current.pause();
      } else {
        voiceAudioRef.current.play();
      }
      setIsVoicePlaying(!isVoicePlaying);
    }
  };

  const toggleMusic = () => {
    if (musicAudioRef.current) {
      if (isMusicPlaying) {
        musicAudioRef.current.pause();
      } else {
        musicAudioRef.current.play();
      }
      setIsMusicPlaying(!isMusicPlaying);
    }
  };

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
        audioDataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(letterData.audioBlob);
        });
      }

      const dataToEncrypt = {
        content: letterData.content,
        audioDataUrl: audioDataUrl,
        senderName: letterData.senderName,
        musicId: letterData.musicId,
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
      icon={<Eye className="w-8 h-8 text-btn-primary" />}
      buttonText={isLoading ? 'Finalizing...' : 'Finalize & Share'}
      onNext={handleFinalize}
      isNextDisabled={isLoading}
      secondaryButtonText="Edit Letter"
      onSecondaryClick={handleEdit}
    >
      <div
        className="p-8 md:p-12 shadow-xl mb-8 relative bg-secondary-bg rounded-lg"
      >
        <div className="absolute top-4 right-4 bg-btn-secondary text-primary-bg px-4 py-1 rounded-full text-sm font-bold">
          PREVIEW MODE
        </div>

        {letterData.audioUrl && (
          <audio
            ref={voiceAudioRef}
            src={letterData.audioUrl}
            onEnded={() => setIsVoicePlaying(false)}
          />
        )}
        {letterData.musicId && (
          <audio
            ref={musicAudioRef}
            src={`/music/${letterData.musicId}.mp3`}
            onEnded={() => setIsMusicPlaying(false)}
            loop
          />
        )}

        <div className="flex items-center gap-4 mb-6">
          {letterData.audioUrl && (
            <button
              onClick={toggleVoice}
              className="flex items-center gap-2 bg-btn-primary text-white font-bold py-2 px-4 rounded-lg hover:shadow-lg transition-all"
            >
              {isVoicePlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              <span>{isVoicePlaying ? 'Pause' : 'Play'} Voice</span>
            </button>
          )}
          {letterData.musicId && (
            <button
              onClick={toggleMusic}
              className="flex items-center gap-2 bg-btn-primary text-white font-bold py-2 px-4 rounded-lg hover:shadow-lg transition-all"
            >
              {isMusicPlaying ? <Pause className="w-5 h-5" /> : <Music className="w-5 h-5" />}
              <span>{isMusicPlaying ? 'Pause' : 'Play'} Music</span>
            </button>
          )}
        </div>

        <div className="prose prose-lg max-w-none">
          <p
            className="whitespace-pre-wrap leading-relaxed text-primary"
          >
            {letterData.content}
          </p>
        </div>
        {letterData.senderName && (
          <p className="text-right mt-8 text-primary">
            - {letterData.senderName}
          </p>
        )}
      </div>
    </StepWrapper>
  );
}
