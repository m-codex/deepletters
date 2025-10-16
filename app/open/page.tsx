"use client";

import { useState, useCallback, useRef, useEffect } from 'react';
import { Upload, Mail, Volume2, VolumeX } from 'lucide-react';
import { importKeyFromString, decryptData } from '@/_lib/crypto';

type DecryptedLetter = {
  content: string;
  senderName: string;
  audioDataUrl: string | null;
  musicUrl: string | null;
  musicVolume: number;
  theme: 'light' | 'dark';
};

export default function OpenLetterPage() {
  const [encryptedFile, setEncryptedFile] = useState<File | null>(null);
  const [decryptedLetter, setDecryptedLetter] = useState<DecryptedLetter | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const voiceAudioRef = useRef<HTMLAudioElement | null>(null);
  const musicAudioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.name.endsWith('.dpl')) {
        setEncryptedFile(file);
        setError(null);
      } else {
        setError('Invalid file type. Please upload a .dpl file.');
        setEncryptedFile(null);
      }
    }
  };

  const handleDecrypt = useCallback(async () => {
    if (!encryptedFile) {
      setError('Please provide the letter file.');
      return;
    }

    setLoading(true);
    setError(null);
    setDecryptedLetter(null);

    try {
      const fileBuffer = await encryptedFile.arrayBuffer();
      const dataView = new DataView(fileBuffer);
      const wrappedKeyLength = dataView.getUint32(0, true);
      const wrappedKeyBuffer = fileBuffer.slice(4, 4 + wrappedKeyLength);
      const encryptedData = fileBuffer.slice(4 + wrappedKeyLength);

      const wrappedKeyString = Buffer.from(wrappedKeyBuffer).toString('base64');

      const response = await fetch('/api/unwrap-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wrappedKey: wrappedKeyString }),
      });

      if (!response.ok) {
        throw new Error('Failed to unwrap key.');
      }

      const { key: letterKeyString } = await response.json();
      const letterKey = await importKeyFromString(letterKeyString);

      const decryptedBuffer = await decryptData(letterKey, encryptedData);
      const decryptedJson = new TextDecoder().decode(decryptedBuffer);
      const letterContent: DecryptedLetter = JSON.parse(decryptedJson);

      setDecryptedLetter(letterContent);
    } catch (err) {
      console.error('Decryption failed:', err);
      setError('Decryption failed. The file may be corrupt or the application has been updated.');
    } finally {
      setLoading(false);
    }
  }, [encryptedFile]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

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

  useEffect(() => {
    if (decryptedLetter) {
      setIsPlaying(true);
    }
  }, [decryptedLetter]);

  if (decryptedLetter) {
    return (
      <div className={`flex justify-center text-center p-10 ${
        decryptedLetter.theme === 'light' ? 'bg-primary-bg' : 'bg-primary'
      }`}>
        <div className="animate-fadeIn max-w-4xl w-full">
          <div className="w-24 h-24 bg-secondary-bg rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Mail className="w-12 h-12 text-btn-primary" />
          </div>
          <h1 className="text-4xl font-bold text-primary mb-6 font-serif">
            A Letter from {decryptedLetter.senderName || 'A secret admirer'}
          </h1>

          <div className="transition-all duration-1000 animate-fadeIn">
            {decryptedLetter.audioDataUrl && (
              <audio
                ref={voiceAudioRef}
                src={decryptedLetter.audioDataUrl}
                onEnded={handleAudioEnd}
                autoPlay
              />
            )}
            {decryptedLetter.musicUrl && (
              <audio
                ref={musicAudioRef}
                src={decryptedLetter.musicUrl}
                loop
                autoPlay
              />
            )}
            <div className={`rounded-lg shadow-2xl p-8 md:p-16 animate-slideUp text-left ${
              decryptedLetter.theme === 'light' ? 'bg-secondary-bg' : 'bg-gray-800'
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
                decryptedLetter.theme === 'light' ? 'text-primary' : 'text-primary-bg'
              }`}>
                <p className="whitespace-pre-wrap leading-relaxed text-lg font-serif">
                  {decryptedLetter.content}
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

  return (
    <div className="min-h-screen flex items-center justify-center text-center p-4">
      <div className="max-w-lg w-full">
        <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4">Open Downloaded Letter</h1>
        <p className="text-lg text-secondary mb-8">Upload a letter file to open it.</p>

        <div className="bg-secondary-bg p-8 rounded-lg shadow-lg w-full">
          <div className="mb-6">
            <button
              onClick={handleUploadClick}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-btn-primary text-white rounded-md font-semibold text-lg hover:shadow-lg transition-shadow"
            >
              <Upload className="w-6 h-6" />
              <span>{encryptedFile ? encryptedFile.name : 'Select .dpl File'}</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept=".dpl"
            />
          </div>

          {error && <p className="text-red-400 mb-4">{error}</p>}

          <button
            onClick={handleDecrypt}
            disabled={!encryptedFile || loading}
            className="w-full px-8 py-4 bg-btn-secondary text-primary rounded-md font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:bg-gray-600 disabled:cursor-not-allowed"
          >
            {loading ? 'Decrypting...' : 'Open Letter'}
          </button>
        </div>
      </div>
    </div>
  );
}