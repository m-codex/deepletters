"use client";

import { useState, useEffect, useRef } from 'react';
import { supabase, Letter } from '@/_lib/supabase';
import { Mail, Volume2, VolumeX } from 'lucide-react';

export default function LetterViewer({ shareCode }: { shareCode: string }) {
  const [letter, setLetter] = useState<Letter | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isOpened, setIsOpened] = useState(false);
  const musicAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    loadLetter();
  }, [shareCode]);

  const loadLetter = async () => {
    try {
      const { data, error: letterError } = await supabase
        .from('letters')
        .select('*')
        .eq('share_code', shareCode)
        .maybeSingle();

      if (letterError) throw letterError;

      if (!data) {
        setError('Letter not found.');
        return;
      }
      setLetter(data);

      await supabase
        .from('letters')
        .update({ view_count: (data.view_count || 0) + 1 })
        .eq('id', data.id);

    } catch (err) {
      console.error('Error loading letter:', err);
      setError('Failed to load the letter. The link may be invalid.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (musicAudioRef.current && typeof letter?.music_volume === 'number') {
      musicAudioRef.current.volume = letter.music_volume;
    }
  }, [letter]);

  useEffect(() => {
    if (isOpened) {
      setIsPlaying(true);
      musicAudioRef.current?.play();
    }
  }, [isOpened]);

  const toggleAudio = () => {
    if (isPlaying) {
      musicAudioRef.current?.pause();
    } else {
      musicAudioRef.current?.play();
    }
    setIsPlaying(!isPlaying);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary-bg">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-btn-primary border-t-transparent"></div>
      </div>
    );
  }

  if (error || !letter) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary-bg">
        <div className="text-center">
          <Mail className="w-16 h-16 text-secondary mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-primary mb-2">
            {error || 'Letter not found'}
          </h2>
          <p className="text-secondary">
            This letter may have been moved or the link is invalid.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex justify-center text-center p-10 ${
      letter.theme === 'light' ? 'bg-primary-bg' : 'bg-primary'
    }`}>
      <div className="animate-fadeIn max-w-4xl w-full">
        <div className="w-24 h-24 bg-secondary-bg rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
          <Mail className="w-12 h-12 text-btn-primary" />
        </div>
        <h1 className="text-4xl font-bold text-primary mb-6 font-serif">
          A Letter from {letter.sender_name || 'A secret admirer'}
        </h1>

        {!isOpened && (
          <>
            {letter.music_url ? (
              <p className="text-secondary mb-8">
                This letter contains audio. Headphones or speakers are recommended.
              </p>
            ) : (
              <p className="text-secondary mb-8">
                Your letter is ready to be opened.
              </p>
            )}
            <button
              onClick={() => setIsOpened(true)}
              className="bg-btn-primary text-white font-bold py-3 px-8 rounded-lg text-lg hover:shadow-xl transition-all transform hover:scale-105"
            >
              Open Letter
            </button>
          </>
        )}

        {isOpened && (
          <>
            <div className="transition-all duration-1000 animate-fadeIn">
              {letter.music_url && (
                <audio
                  ref={musicAudioRef}
                  src={letter.music_url}
                  loop
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />
              )}
              <div className={`rounded-lg shadow-2xl p-8 md:p-16 animate-slideUp text-left ${
                letter.theme === 'light' ? 'bg-secondary-bg' : 'bg-gray-800'
              }`}>
                {letter.music_url && (
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
                Created with <span className="text-btn-primary">♥</span> on Deepletter.org
              </p>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 1s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.8s ease-out;
        }
        .animate-fadeInUp {
          animation: fadeInUp 0.8s ease-out;
        }
      `}</style>
    </div>
  );
}