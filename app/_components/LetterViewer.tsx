"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase, Letter } from '@/_lib/supabase';
import { Mail, Volume2, VolumeX, Download } from 'lucide-react';
import { importKeyFromString, decryptData } from '@/_lib/crypto';
import LetterDisplay from '@/_components/LetterDisplay';

type DecryptedLetter = {
  content: string;
  senderName: string;
  audioDataUrl: string | null;
  musicUrl: string | null;
  musicVolume: number;
};

const formatTimeLeft = (expirationDate: Date) => {
  const now = new Date();
  const timeLeft = expirationDate.getTime() - now.getTime();

  if (timeLeft <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  }

  const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds, expired: false };
};

export default function LetterViewer({ shareCode }: { shareCode: string }) {
  const [letterMetadata, setLetterMetadata] = useState<Letter | null>(null);
  const [decryptedLetter, setDecryptedLetter] = useState<DecryptedLetter | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isOpened, setIsOpened] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ days: 7, hours: 0, minutes: 0, seconds: 0, expired: false });
  const [downloading, setDownloading] = useState(false);
  const [downloadMessage, setDownloadMessage] = useState('');
  const voiceAudioRef = useRef<HTMLAudioElement | null>(null);
  const musicAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const loadLetter = useCallback(async (keyString: string) => {
    try {
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
      if (letterData.expires_at && new Date(letterData.expires_at) < new Date()) {
        setError('This letter has expired.');
        return;
      }
      setLetterMetadata(letterData);

      const { data: fileData, error: fileError } = await supabase.storage
        .from('encrypted-letters')
        .download(letterData.storage_path);

      if (fileError) throw fileError;

      const encryptionKey = await importKeyFromString(keyString);
      const decryptedBuffer = await decryptData(encryptionKey, await fileData.arrayBuffer());
      const decryptedJson = new TextDecoder().decode(decryptedBuffer);
      const letterContent: DecryptedLetter = JSON.parse(decryptedJson);
      setDecryptedLetter(letterContent);

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
    if (letterMetadata?.expires_at) {
      const expirationDate = new Date(letterMetadata.expires_at);
      const updateTimer = () => {
        setTimeLeft(formatTimeLeft(expirationDate));
      };

      updateTimer();
      const timerId = setInterval(updateTimer, 1000);

      return () => clearInterval(timerId);
    }
  }, [letterMetadata?.expires_at]);

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

  const handleDownload = async () => {
    if (!letterMetadata || !letterMetadata.storage_path || !decryptedLetter) {
      return;
    }

    setDownloading(true);
    setDownloadMessage('');

    try {
      const { data: fileData, error: fileError } = await supabase.storage
        .from('encrypted-letters')
        .download(letterMetadata.storage_path);

      if (fileError) throw fileError;

      const senderName = decryptedLetter.senderName || 'Anonymous';
      const date = new Date(letterMetadata.created_at);
      const timestamp = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}${date.getHours().toString().padStart(2, '0')}${date.getMinutes().toString().padStart(2, '0')}${date.getSeconds().toString().padStart(2, '0')}`;
      const filename = `${timestamp}_A_Letter_from_${senderName}.dpl`;

      const blob = new Blob([await fileData.arrayBuffer()], { type: 'application/octet-stream' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      setDownloadMessage('Download started! You can open the downloaded file at deepletters.org.');
    } catch (err) {
      console.error('Error downloading letter:', err);
      setDownloadMessage('Failed to download the letter.');
    } finally {
      setDownloading(false);
    }
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

        {isOpened && decryptedLetter && (
          <>
            <LetterDisplay
              letter={{
                ...decryptedLetter,
                theme: letterMetadata.theme as 'light' | 'dark',
              }}
            />
            <div className="mt-12 text-center">
              {timeLeft.expired ? (
                <>
                  <p className="text-red-500 text-base">This letter has expired.</p>
                  <button
                    onClick={handleDownload}
                    disabled={downloading}
                    className="text-sm text-btn-primary hover:underline mt-2"
                  >
                    <Download className="w-4 h-4 inline-block mr-1" />
                    {downloading ? 'Downloading...' : 'Download to keep forever'}
                  </button>
                </>
              ) : (
                <p className="text-sm text-secondary">
                  This letter expires in: {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
                </p>
              )}
              {downloadMessage && (
                <p className="text-sm text-secondary mt-2">{downloadMessage}</p>
              )}
               <div className="text-center mt-8">
          <p className="text-sm opacity-75 text-secondary">
            Created with <span className="text-btn-primary">♥</span> on Deepletter.org
          </p>
        </div>
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
