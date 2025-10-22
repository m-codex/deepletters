"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLetterData } from "../useLetterData";
import { MailCheck, Play, Pause } from "lucide-react";
import StepWrapper from "./StepWrapper";
import { Letter } from "@/_lib/supabase";
import { useSupabase } from "../SupabaseProvider";
import shortUUID from "short-uuid";

export default function PreviewStep() {
  const router = useRouter();
  const { letterData, updateLetterData } = useLetterData();
  const supabase = useSupabase();
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const musicAudioRef = useRef<HTMLAudioElement>(null);

  const togglePlayPause = () => {
    const musicAudio = musicAudioRef.current;

    if (isPlaying) {
      musicAudio?.pause();
      setIsPlaying(false);
    } else {
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

  const handleEdit = () => {
    router.push("/create/write");
  };

  const handleFinalize = async () => {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const finalizedAt = new Date().toISOString();
    const managementToken = shortUUID.generate();
    const shareCode = letterData.shareCode || shortUUID.generate();

    try {
      if (user && letterData.id) {
        // Logged-in user: Update the existing draft to finalized
        const { error } = await supabase
          .from('letters')
          .update({
            status: 'finalized',
            finalized_at: finalizedAt,
            management_token: managementToken,
            share_code: shareCode,
          })
          .eq('id', letterData.id);
        if (error) throw error;
      } else {
        // Anonymous user: Insert a new finalized letter
        const { data, error } = await supabase
          .from('letters')
          .insert({
            content: letterData.content,
            sender_name: letterData.senderName,
            recipient_name: letterData.recipientName,
            theme: letterData.theme,
            music_url: letterData.musicUrl,
            music_volume: letterData.musicVolume,
            status: 'finalized',
            finalized_at: finalizedAt,
            management_token: managementToken,
            share_code: shareCode,
            temp_id: localStorage.getItem('temp_id'),
          })
          .select('temp_id')
          .single();
        if (error) throw error;
        if (data?.temp_id) {
          localStorage.setItem('temp_id', data.temp_id);
        }
      }

      localStorage.removeItem('letterData');
      localStorage.removeItem('temp_id');
      const postLoginAction = { action: 'claim', shareCode: shareCode };
      console.log('Finalizing anonymous letter. Setting postLoginAction:', postLoginAction);
      localStorage.setItem('postLoginAction', JSON.stringify(postLoginAction));
      updateLetterData({ shareCode: null });
      router.replace(`/manage/${managementToken}`);
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

        {letterData.musicUrl && (
          <audio
            ref={musicAudioRef}
            src={letterData.musicUrl}
            loop
            onEnded={() => setIsPlaying(false)}
          />
        )}

        <div className="flex items-center gap-4 mb-6">
          {(letterData.musicUrl) && (
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
                className="w-32 accent-btn-primary"
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