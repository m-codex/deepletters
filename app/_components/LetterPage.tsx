"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Share2, Copy, Check, Loader2, Eye, Mail, Stamp } from 'lucide-react';
import PayPalButton, { PayPalOrder } from './PayPalButton';
import { supabase, Letter } from '@/_lib/supabase';

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
  const [showPayPal, setShowPayPal] = useState(false);

  const handlePaymentSuccess = async (order: PayPalOrder) => {
    console.log('Payment successful:', order);

    if (letter) {
      const { error } = await supabase
        .from('letters')
        .update({ is_paid: true })
        .eq('share_code', letter.share_code);

      if (error) {
        console.error('Error updating payment status:', error);
        alert('Payment was successful, but we could not update your letter. Please contact support.');
      } else {
        alert('Thank you for your purchase! Your letter is now saved forever.');
        setLetter({ ...letter, is_paid: true });
      }
    }
    setShowPayPal(false);
  };

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

  const shareUrl = `${window.location.origin}/letter/${letter?.share_code}`;

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 md:p-8">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-secondary-bg rounded-full mb-4">
          <Mail className="w-8 h-8 text-btn-primary" />
        </div>
        <h2 className="text-4xl text-primary mb-4">Your Letter is Ready!</h2>

        <p className="text-secondary text-lg">
          This letter is free available for 7 days. Add a digital stamp to keep it forever — one purchase gives lifetime access to both.
        </p>
        <div className="flex flex-col gap-3 my-8">
          {letter?.is_paid ? (
            <div className="flex-1 py-3 px-4 bg-green-500 text-white rounded-md font-semibold text-lg flex items-center justify-center gap-2">
              <Stamp className="w-5 h-5" />
              Paid
            </div>
          ) : showPayPal ? (
            <div className="flex flex-col items-center bg-white rounded-md p-4">
              <PayPalButton amount="1.00" onPaymentSuccess={handlePaymentSuccess} />
              <button
                onClick={() => setShowPayPal(false)}
                className="mt-2 text-sm text-btn-primary hover:underline"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowPayPal(true)}
              className="flex-1 py-3 px-4 bg-btn-primary text-white rounded-md font-semibold text-lg flex items-center justify-center gap-2 hover:shadow-lg transition-shadow"
            >
              <Stamp className="w-5 h-5" />
              Buy Stamp for 1$
            </button>
          )}
          <a
            href={shareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-3 px-4 bg-btn-secondary text-bg-primary rounded-md font-semibold text-lg flex items-center justify-center gap-2 hover:shadow-lg transition-shadow"
          >
            <Eye className="w-5 h-5" />
            View Letter
          </a>          
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
              className="px-6 py-3 bg-btn-primary text-white rounded-md font-semibold flex items-center gap-2 hover:shadow-lg transition-shadow"
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
{/*
<div className="mb-8">
  <label className="block text-sm text-secondary mb-3">
    QR Code
  </label>
  <div className="flex justify-center bg-white rounded-md p-8">
    {qrCodeUrl && (
      <img
        src={qrCodeUrl}
        alt="QR Code"
        className="w-64 h-64 rounded-xl shadow-md"
      />
    )}
  </div>
  <p className="text-center text-sm text-secondary mt-4">
    Scan this code to open the letter
  </p>
</div>
*/}


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
