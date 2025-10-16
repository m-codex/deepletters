"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase, Letter } from '@/_lib/supabase';
import { Mail, Volume2, VolumeX, Crown } from 'lucide-react';
import { importKeyFromString, decryptData } from '@/_lib/crypto';

type DecryptedLetter = {
  content: string;
  senderName: string;
  audioDataUrl: string | null;
  musicUrl: string | null;
  musicVolume: number;
};

export default function LetterViewer({ shareCode }: { shareCode: string }) {
  const [letterMetadata, setLetterMetadata] = useState<Letter | null>(null);
  const [decryptedLetter, setDecryptedLetter] = useState<DecryptedLetter | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isOpened, setIsOpened] = useState(false);
  const voiceAudioRef = useRef<HTMLAudioElement | null>(null);
  const musicAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const loadLetter = useCallback(async (keyString: string) => {
    try {
      // 1. Fetch letter metadata
      const { data: letterData, error: letterError } = await supabase
        .from('letters')
        .select('*')
        .eq('share_code', shareCode)
        .maybeSingle();

      if (letterError) throw letterError;

      if (!letterData || !letterData.storage_path) {
        setError('Letter not found or has expired.');
        return;
      }
      if (letterData.expires_at && new Date(letterData.expires_at) < new Date() && !letterData.is_permanent) {
        setError('This letter has expired.');
        return;
      }
      setLetterMetadata(letterData);

      // 2. Download encrypted file
      const { data: fileData, error: fileError } = await supabase.storage
        .from('encrypted-letters')
        .download(letterData.storage_path);

      if (fileError) throw fileError;

      // 3. Import key and decrypt data
      const encryptionKey = await importKeyFromString(keyString);
      const decryptedBuffer = await decryptData(encryptionKey, await fileData.arrayBuffer());
      const decryptedJson = new TextDecoder().decode(decryptedBuffer);
      const letterContent: DecryptedLetter = JSON.parse(decryptedJson);
      setDecryptedLetter(letterContent);

      // 4. Increment view count
      await supabase
        .from('letters')
        .update({ view_count: letterData.view_count + 1 })
        .eq('id', letterData.id);

    } catch (err) {
      console.error('Error loading or decrypting letter:', err);
      setError('Failed to load or decrypt the letter. The link may be invalid.');
    } finally {
      setLoading(false);
    }
  }, [shareCode]);

  useEffect(() => {
    if (shareCode) {
      const keyString = window.location.hash.substring(1);
      if (keyString) {
        loadLetter(keyString);
      } else {
        setError('Encryption key not found in URL.');
        setLoading(false);
      }
    }
  }, [shareCode, loadLetter]);

  useEffect(() => {
    if (musicAudioRef.current && typeof decryptedLetter?.musicVolume === 'number') {
      musicAudioRef.current.volume = decryptedLetter.musicVolume;
    }
  }, [decryptedLetter]);

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

  if (error || !decryptedLetter || !letterMetadata) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary-bg">
        <div className="text-center">
          <Mail className="w-16 h-16 text-secondary mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-primary mb-2">
            {error || 'Letter not found'}
          </h2>
          <p className="text-secondary">
            This letter may have expired or the link is invalid.
          </p>
        </div>
      </div>
    );
  }

  const expiresIn = letterMetadata.expires_at
    ? Math.ceil((new Date(letterMetadata.expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className={`flex justify-center text-center p-10 ${
      letterMetadata.theme === 'light' ? 'bg-primary-bg' : 'bg-primary'
    }`}>
      <div className="animate-fadeIn max-w-4xl w-full">
        <div className="w-24 h-24 bg-secondary-bg rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
          <Mail className="w-12 h-12 text-btn-primary" />
        </div>
        <h1 className="text-4xl font-bold text-primary mb-6 font-serif">
          A Letter from {decryptedLetter.senderName || 'A secret admirer'}
        </h1>

        {!isOpened && (
          <>
            {(decryptedLetter.audioDataUrl || decryptedLetter.musicUrl) ? (
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
              {decryptedLetter.audioDataUrl && (
                <audio
                  ref={voiceAudioRef}
                  src={decryptedLetter.audioDataUrl}
                  onEnded={handleAudioEnd}
                />
              )}
              {decryptedLetter.musicUrl && (
                <audio
                  ref={musicAudioRef}
                  src={decryptedLetter.musicUrl}
                  loop
                />
              )}
              <div className={`rounded-lg shadow-2xl p-8 md:p-16 animate-slideUp text-left ${
                letterMetadata.theme === 'light' ? 'bg-secondary-bg' : 'bg-gray-800'
              }`}>
                {(decryptedLetter.audioDataUrl || decryptedLetter.musicUrl) && (
                  <button
                    onClick={toggleAudio}
                    className="float-right w-12 h-12 bg-btn-primary rounded-full flex items-center justify-center text-white shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-200"
                  >
                    {isPlaying ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                  </button>
                )}
                <div className={`prose prose-lg max-w-none mb-8 animate-fadeInUp ${
                  letterMetadata.theme === 'light' ? 'text-primary' : 'text-primary-bg'
                }`}>
                  <p className="whitespace-pre-wrap leading-relaxed text-lg font-serif">
                    {decryptedLetter.content}
                  </p>
                </div>

                {!letterMetadata.is_permanent && expiresIn !== null && (
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

                {letterMetadata.is_permanent && (
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
