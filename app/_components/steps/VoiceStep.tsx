"use client";

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mic, Square, Play, Pause, Trash2, Loader2 } from 'lucide-react';
import { useLetterData } from '../useLetterData';
import StepWrapper from './StepWrapper';
import { supabase } from '@/_lib/supabase';

export default function VoiceStep() {
  const router = useRouter();
  const { letterData, updateLetterData } = useLetterData();
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(letterData.audioUrl);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setAudioUrl(letterData.audioUrl);
  }, [letterData.audioUrl]);

  const uploadAudio = async (blob: Blob) => {
    if (!letterData.shareCode) {
      const errorMsg = 'No share code available for upload.';
      console.error(errorMsg);
      setUploadError(errorMsg);
      return;
    }

    setIsUploading(true);
    const filePath = `public/${letterData.shareCode}-${Date.now()}.webm`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('voice-recordings')
        .upload(filePath, blob);

      if (uploadError) {
        throw uploadError;
      }

      const { data: publicUrlData } = supabase.storage
        .from('voice-recordings')
        .getPublicUrl(filePath);

      if (!publicUrlData.publicUrl) {
        throw new Error('Could not get public URL for audio.');
      }

      const publicUrl = publicUrlData.publicUrl;
      setAudioUrl(publicUrl);
      updateLetterData({ audioUrl: publicUrl, audioBlob: null });
      setUploadError(null);

    } catch (error) {
      console.error('Error uploading audio:', error);
      const errorMessage = JSON.stringify(error, Object.getOwnPropertyNames(error));
      setUploadError(`Upload failed: ${errorMessage}`);
      setAudioUrl(null);
    } finally {
      setIsUploading(false);
    }
  };

  const startRecording = async () => {
    try {
      setUploadError(null);
      // Clear previous recording before starting a new one
      setAudioUrl(null);
      updateLetterData({ audioUrl: null, audioBlob: null });

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const options = { mimeType: 'audio/webm; codecs=opus' };
      const mediaRecorder = MediaRecorder.isTypeSupported(options.mimeType)
        ? new MediaRecorder(stream, options)
        : new MediaRecorder(stream);

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const localUrl = URL.createObjectURL(blob);
        setAudioUrl(localUrl); // Set local URL for immediate playback
        stream.getTracks().forEach((track) => track.stop());
        uploadAudio(blob); // Upload in the background
      };

      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);

      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone. Please check your permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const togglePlayback = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const deleteRecording = () => {
    setAudioUrl(null);
    updateLetterData({ audioBlob: null, audioUrl: null });
    setIsPlaying(false);
    setDuration(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleNext = () => {
    // audioBlob is intentionally not cleared here, so the user can re-record if they go back
    router.push('/create/music');
  };

  const handleSkip = () => {
    updateLetterData({ audioBlob: null, audioUrl: null });
    router.push('/create/music');
  };

  return (
    <StepWrapper
      title="Record Your Voice"
      description="Read your letter aloud to add a personal touch"
      icon={<Mic className="w-8 h-8 text-btn-primary" />}
      buttonText={audioUrl ? 'Next Step' : 'Skip This Step'}
      onNext={audioUrl ? handleNext : handleSkip}
      isNextDisabled={isUploading}
    >
      <div className="bg-secondary-bg shadow-xl p-8 md:p-12">
        <div className="flex flex-col items-center gap-6 mb-6">
          {!audioUrl && !isRecording && !isUploading && (
            <button
              onClick={startRecording}
              className="w-24 h-24 bg-btn-primary rounded-full flex items-center justify-center text-white shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-200"
            >
              <Mic className="w-10 h-10" />
            </button>
          )}

          {isUploading && (
            <div className="flex flex-col items-center gap-4 text-center">
              <Loader2 className="w-16 h-16 text-btn-primary animate-spin" />
              <p className="text-lg text-secondary">Uploading your recording...</p>
            </div>
          )}

          {isRecording && (
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-2xl font-mono">{formatTime(duration)}</span>
              </div>
              <button
                onClick={stopRecording}
                className="w-24 h-24 bg-red-500 rounded-full flex items-center justify-center text-white shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-200"
              >
                <Square className="w-10 h-10" />
              </button>
            </div>
          )}

          {audioUrl && !isRecording && !isUploading && (
            <div className="w-full max-w-md">
              <audio
                ref={audioRef}
                src={audioUrl}
                onEnded={() => setIsPlaying(false)}
                className="hidden"
              />
              <div className="flex items-center gap-4 bg-gray-50 rounded-2xl p-6">
                <button
                  onClick={togglePlayback}
                  className="w-14 h-14 bg-btn-primary rounded-full flex items-center justify-center text-white shadow-md hover:shadow-lg transform hover:scale-110 transition-all duration-200"
                >
                  {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
                </button>
                <div className="flex-1">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-btn-primary w-0 animate-pulse"></div>
                  </div>
                </div>
                <button
                  onClick={deleteRecording}
                  className="w-10 h-10 bg-red-50 hover:bg-red-100 rounded-full flex items-center justify-center text-red-500 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {uploadError && (
            <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              <p className="font-bold">Error</p>
              <p>{uploadError}</p>
            </div>
          )}
        </div>
        <div className="bg-primary-bg rounded-md p-6 mb-8 max-h-64 overflow-y-auto">
          <p className="text-secondary leading-relaxed font-serif whitespace-pre-wrap">
            {letterData.content}
          </p>
        </div>
      </div>
    </StepWrapper>
  );
}
