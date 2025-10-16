"use client";

import { useState, useEffect, useRef } from 'react';
import { Mail, Volume2, VolumeX } from 'lucide-react';

type LetterDisplayProps = {
  letter: {
    content: string;
    senderName: string;
    audioDataUrl: string | null;
    musicUrl: string | null;
    musicVolume: number;
    theme: 'light' | 'dark';
  };
};

export default function LetterDisplay({ letter }: LetterDisplayProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const voiceAudioRef = useRef<HTMLAudioElement | null>(null);
  const musicAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (musicAudioRef.current && typeof letter.musicVolume === 'number') {
      musicAudioRef.current.volume = letter.musicVolume;
    }
  }, [letter.musicVolume]);

  useEffect(() => {
    // Autoplay when the component mounts
    setIsPlaying(true);
    voiceAudioRef.current?.play().catch(e => console.error("Autoplay failed:", e));
    musicAudioRef.current?.play().catch(e => console.error("Autoplay failed:", e));
  }, []);

  const toggleAudio = () => {
    if (isPlaying) {
      voiceAudioRef.current?.pause();
      musicAudioRef.current?.pause();
    } else {
      voiceAudioRef.current?.play();
      musicAudioRef.current?.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleAudioEnd = () => {
    setIsPlaying(false);
    if (musicAudioRef.current) {
      musicAudioRef.current.pause();
      musicAudioRef.current.currentTime = 0;
    }
  };

  return (
    <div className={`flex justify-center text-center p-10 ${
      letter.theme === 'light' ? 'bg-primary-bg' : 'bg-primary'
    }`}>
      <div className="animate-fadeIn max-w-4xl w-full">
        <div className="w-24 h-24 bg-secondary-bg rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
          <Mail className="w-12 h-12 text-btn-primary" />
        </div>
        <h1 className="text-4xl font-bold text-primary mb-6 font-serif">
          A Letter from {letter.senderName || 'A secret admirer'}
        </h1>

        <div className="transition-all duration-1000 animate-fadeIn">
          {letter.audioDataUrl && (
            <audio
              ref={voiceAudioRef}
              src={letter.audioDataUrl}
              onEnded={handleAudioEnd}
            />
          )}
          {letter.musicUrl && (
            <audio
              ref={musicAudioRef}
              src={letter.musicUrl}
              loop
            />
          )}
          <div className={`rounded-lg shadow-2xl p-8 md:p-16 animate-slideUp text-left ${
            letter.theme === 'light' ? 'bg-secondary-bg' : 'bg-gray-800'
          }`}>
            {(letter.audioDataUrl || letter.musicUrl) && (
              <button
                onClick={toggleAudio}
                className="float-right w-12 h-12 bg-btn-primary rounded-full flex items-center justify-center text-white shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-200"
              >
                {isPlaying ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
              </button>
            )}
            <div className={`prose prose-lg max-w-none mb-8 animate-fadeInUp ${
              letter.theme === 'light' ? 'text-primary' : 'text-primary-bg'
            }`}>
              <p className="whitespace-pre-wrap leading-relaxed text-lg font-serif">
                {letter.content}
              </p>
            </div>
          </div>
        </div>
        <div className="text-center mt-8">
          <p className="text-sm opacity-75 text-secondary">
            Opened from a downloaded file on Deepletter.org
          </p>
        </div>
      </div>
    </div>
  );
}