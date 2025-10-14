"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { supabase, Letter } from '@/_lib/supabase';
import { Mail, Volume2, VolumeX, Crown } from 'lucide-react';

export default function LetterViewer({ shareCode }: { shareCode: string }) {
  const [letter, setLetter] = useState<Letter | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isOpened, setIsOpened] = useState(false);
  const voiceAudioRef = useRef<HTMLAudioElement | null>(null);
  const musicAudioRef = useRef<HTMLAudioElement | null>(null);


  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTo(0, 0);
    document.body.scrollTo(0, 0);
  }, []);

  const loadLetter = useCallback(async () => {
    try {
      const { data: letterData, error: letterError } = await supabase
        .from('letters')
        .select('*')
        .eq('share_code', shareCode)
        .maybeSingle();

      if (letterError) throw letterError;

      if (!letterData) {
        setError('Letter not found or has expired');
        setLoading(false);
        return;
      }

      if (letterData.expires_at && new Date(letterData.expires_at) < new Date() && !letterData.is_permanent) {
        setError('This letter has expired');
        setLoading(false);
        return;
      }

      await supabase
        .from('letters')
        .update({ view_count: letterData.view_count + 1 })
        .eq('id', letterData.id);

      setLetter(letterData);
    } catch (err) {
      console.error('Error loading letter:', err);
      setError('Failed to load letter');
    } finally {
      setLoading(false);
    }
  }, [shareCode]);

  useEffect(() => {
    if (shareCode) {
      loadLetter();
    }
  }, [shareCode, loadLetter]);

  useEffect(() => {
    if (isOpened) {
      setIsPlaying(true);
      voiceAudioRef.current?.play();
      musicAudioRef.current?.play();
    }
  }, [isOpened]);

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

  const handleUpgrade = async () => {
    alert('Payment integration coming soon! This would upgrade the letter to permanent storage.');
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
            This letter may have expired or the link is invalid
          </p>
        </div>
      </div>
    );
  }

  const expiresIn = letter.expires_at
    ? Math.ceil((new Date(letter.expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary-bg text-center p-6">
      <div className="animate-fadeIn max-w-4xl w-full">
        <div className="w-24 h-24 bg-secondary-bg rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
          <Mail className="w-12 h-12 text-btn-primary" />
        </div>
        <h1 className="text-4xl font-bold text-primary mb-4 font-serif">
          A Letter from {letter.sender_name || 'A secret admirer'}
        </h1>

        {!isOpened && (
          <>
            {(letter.audio_url || letter.music_id) ? (
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
              {letter.audio_url && (
                <audio
                  ref={voiceAudioRef}
                  src={letter.audio_url}
                  onEnded={handleAudioEnd}
                />
              )}
               {letter.music_id && (
                <audio
                  ref={musicAudioRef}
                  src={`/music/${letter.music_id}.mp3`}
                  loop
                />
              )}
              <div className="bg-secondary-bg rounded-lg shadow-2xl p-8 md:p-16 animate-slideUp text-left">
                {(letter.audio_url || letter.music_id) && (
                  <button
                    onClick={toggleAudio}
                    className="float-right w-12 h-12 bg-btn-primary rounded-full flex items-center justify-center text-white shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-200"
                  >
                    {isPlaying ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                  </button>
                )}
                <div className="prose prose-lg max-w-none mb-8 animate-fadeInUp text-primary">
                  <p className="whitespace-pre-wrap leading-relaxed text-lg font-serif">
                    {letter.content}
                  </p>
                </div>

                {!letter.is_permanent && expiresIn !== null && (
                  <div className="mt-12 text-center">
                    <p className="text-sm text-secondary">
                      This letter expires in {expiresIn} {expiresIn === 1 ? 'day' : 'days'}.{' '}
                      <button
                        onClick={handleUpgrade}
                        className="font-semibold text-btn-primary hover:underline bg-transparent border-none p-0 cursor-pointer"
                      >
                        Keep it forever.
                      </button>
                    </p>
                  </div>
                )}

                {letter.is_permanent && (
                  <div className="mt-12 p-6 bg-secondary-bg border-2 border-btn-primary rounded-lg">
                    <div className="flex items-center gap-3 text-primary">
                      <Crown className="w-6 h-6 text-btn-primary" />
                      <span className="font-semibold">This letter is preserved forever</span>
                    </div>
                  </div>
                )}
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
        .animation-delay-500 {
          animation-delay: 0.5s;
          animation-fill-mode: both;
        }
      `}</style>
    </div>
  );
}
