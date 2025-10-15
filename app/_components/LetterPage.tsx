"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Share2, Copy, Check, Loader2, Eye, Mail, Download } from 'lucide-react';
import { supabase, Letter } from '@/_lib/supabase';
import { importKeyFromString, decryptData } from '@/_lib/crypto';

// Helper function to format the remaining time
const formatTimeLeft = (expirationDate: Date) => {
  const now = new Date();
  const timeLeft = expirationDate.getTime() - now.getTime();

  if (timeLeft <= 0) {
    return { days: 0, hours: 0, minutes: 0, expired: true };
  }

  const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

  return { days, hours, minutes, expired: false };
};

export default function LetterPage({
  managementToken,
  encryptionKey,
}: {
  managementToken: string;
  encryptionKey?: string;
}) {
  const router = useRouter();
  const [letter, setLetter] = useState<Letter | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ days: 7, hours: 0, minutes: 0, expired: false });

  const fetchData = useCallback(async () => {
    try {
      if (!managementToken) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('letters')
        .select('*')
        .eq('management_token', managementToken)
        .single();

      if (error) throw error;

      setLetter(data);
    } catch (error) {
      console.error('Error fetching letter:', error);
      alert('Failed to fetch letter. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [managementToken]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (letter?.created_at) {
      const expirationDate = new Date(new Date(letter.created_at).getTime() + 7 * 24 * 60 * 60 * 1000);
      const updateTimer = () => {
        setTimeLeft(formatTimeLeft(expirationDate));
      };

      updateTimer();
      const timerId = setInterval(updateTimer, 60000); // Update every minute

      return () => clearInterval(timerId);
    }
  }, [letter?.created_at]);

  const shareUrl = letter
    ? `${window.location.origin}/letter/${letter.share_code}${
        encryptionKey ? `#${encryptionKey}` : ''
      }`
    : '';

  const copyToClipboard = async () => {
    if (shareUrl) {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = async () => {
    if (!letter || !letter.storage_path || !encryptionKey) {
      alert('Could not download letter. Information missing.');
      return;
    }

    try {
      const { data: fileData, error: fileError } = await supabase.storage
        .from('encrypted-letters')
        .download(letter.storage_path);

      if (fileError) throw fileError;

      const encryptionKeyObj = await importKeyFromString(encryptionKey);
      const arrayBuffer = await fileData.arrayBuffer();
      const decryptedBuffer = await decryptData(encryptionKeyObj, arrayBuffer);
      const decryptedJson = new TextDecoder().decode(decryptedBuffer);
      const letterContent = JSON.parse(decryptedJson);
      const senderName = letterContent.senderName || 'Anonymous';

      const timestamp = new Date(letter.created_at).toISOString().replace(/[-:.]/g, '').slice(0, 14);
      const filename = `${timestamp}_A_Letter_from_${senderName}.json`;

      const blob = new Blob([arrayBuffer], { type: 'application/octet-stream' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error downloading or decrypting letter:', err);
      alert('Failed to download the letter.');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-12 h-12 text-btn-primary animate-spin mb-4" />
        <p className="text-secondary">Loading your letter...</p>
      </div>
    );
  }

  if (!letter) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-secondary">Letter not found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 md:p-8">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-secondary-bg rounded-full mb-4">
          <Mail className="w-8 h-8 text-btn-primary" />
        </div>
        <h2 className="text-4xl text-primary mb-4">Your Letter is Ready!</h2>

        <p className="text-secondary text-lg">
          This letter is available for 7 days. You can view it or download the
          encrypted file.
        </p>
        <div className="flex flex-col gap-3 my-8">
          <a
            href={shareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-3 px-4 bg-btn-primary text-white rounded-md font-semibold text-lg flex items-center justify-center gap-2 hover:shadow-lg transition-shadow"
          >
            <Eye className="w-5 h-5" />
            View Letter
          </a>
          <button
            onClick={handleDownload}
            disabled={timeLeft.expired}
            className="flex-1 py-3 px-4 bg-btn-secondary text-bg-primary rounded-md font-semibold text-lg flex items-center justify-center gap-2 hover:shadow-lg transition-shadow disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <Download className="w-5 h-5" />
            Download Letter
          </button>
          {timeLeft.expired ? (
            <p className="text-red-500 text-sm mt-2">The download link has expired.</p>
          ) : (
            <p className="text-secondary text-sm mt-2">
              Download expires in: {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m
            </p>
          )}
        </div>
      </div>

      <div className="bg-secondary-bg shadow-xl p-8 md:p-12 mb-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-bg rounded-full mb-4">
            <Share2 className="w-8 h-8 text-btn-primary" />
          </div>
          <h2 className="text-4xl text-primary mb-4">Send Your Letter</h2>
          <label className="block text-left text-sm text-secondary mb-3">
            Share Link
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={shareUrl}
              readOnly
              className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 font-mono text-sm"
            />
            <button
              onClick={copyToClipboard}
              className="px-6 py-3 bg-btn-primary text-white rounded-md font-semibold flex items-center justify-center gap-2 hover:shadow-lg transition-shadow"
            >
              {copied ? (
                <>
                  <Check className="w-5 h-5" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5" />
                  Copy
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <button
        onClick={() => {
          localStorage.removeItem('lastFinalizedShareCode');
          router.push('/');
        }}
        className="w-full py-4 bg-btn-secondary text-primary-bg rounded-md font-semibold text-lg  transition-colors"
      >
        Create Another Letter
      </button>
    </div>
  );
}
