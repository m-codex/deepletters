"use client";

import { useState, useCallback, useRef } from 'react';
import { Upload, KeySquare } from 'lucide-react';
import { importKeyFromString, decryptData } from '@/_lib/crypto';
import LetterDisplay from '@/_components/LetterDisplay';

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
  const [decryptionKey, setDecryptionKey] = useState('');
  const [decryptedLetter, setDecryptedLetter] = useState<DecryptedLetter | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
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
    if (!encryptedFile || !decryptionKey) {
      setError('Please provide both the letter file and the decryption key.');
      return;
    }

    setLoading(true);
    setError(null);
    setDecryptedLetter(null);

    try {
      const key = await importKeyFromString(decryptionKey);
      const fileBuffer = await encryptedFile.arrayBuffer();
      const decryptedBuffer = await decryptData(key, fileBuffer);
      const decryptedJson = new TextDecoder().decode(decryptedBuffer);
      const letterContent: DecryptedLetter = JSON.parse(decryptedJson);

      setDecryptedLetter(letterContent);
    } catch (err) {
      console.error('Decryption failed:', err);
      setError('Decryption failed. Please check the file and key and try again.');
    } finally {
      setLoading(false);
    }
  }, [encryptedFile, decryptionKey]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  if (decryptedLetter) {
    return (
      <div className="min-h-screen">
        <LetterDisplay letter={decryptedLetter} />
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

          <div className="mb-6">
            <div className="relative">
              <KeySquare className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary" />
              <input
                type="text"
                value={decryptionKey}
                onChange={(e) => setDecryptionKey(e.target.value)}
                placeholder="Enter decryption key"
                className="w-full pl-12 pr-4 py-4 bg-primary-bg border border-secondary-bg rounded-md text-primary placeholder-secondary focus:ring-2 focus:ring-btn-primary focus:outline-none"
              />
            </div>
          </div>

          {error && <p className="text-red-400 mb-4">{error}</p>}

          <button
            onClick={handleDecrypt}
            disabled={!encryptedFile || !decryptionKey || loading}
            className="w-full px-8 py-4 bg-btn-secondary text-primary rounded-md font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:bg-gray-600 disabled:cursor-not-allowed"
          >
            {loading ? 'Decrypting...' : 'Open Letter'}
          </button>
        </div>
      </div>
    </div>
  );
}