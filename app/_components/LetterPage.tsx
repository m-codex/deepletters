"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Share2, Copy, Check, Loader2, Eye, Mail, Save, LayoutDashboard } from 'lucide-react';
import { Letter } from '@/_lib/supabase';
import AuthModal from './AuthModal';
import { useSupabase } from './SupabaseProvider';

export default function LetterPage({
  managementToken,
}: {
  managementToken: string;
}) {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const router = useRouter();
  const [letter, setLetter] = useState<Letter | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const supabase = useSupabase();

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
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setUser(session.user);
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchData]);

  const shareUrl = letter
    ? `${window.location.origin}/letter/${letter.share_code}`
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

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 md:p-8">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-secondary-bg rounded-full mb-4">
          <Mail className="w-8 h-8 text-btn-primary" />
        </div>
        <h2 className="text-4xl text-primary mb-4">Your Letter is Ready!</h2>
        <p className="text-secondary text-lg">
          You can now share the link with the recipient.
        </p>
        <div className="flex flex-col gap-3 my-8">
          <button
            onClick={async () => {
              if (navigator.share) {
                try {
                  await navigator.share({
                    title: 'A letter for you',
                    text: 'I wrote a letter for you. I hope you like it.',
                    url: shareUrl,
                  });
                } catch (error) {
                  console.error('Error sharing:', error);
                }
              } else {
                copyToClipboard();
              }
            }}
            className="flex-1 py-3 px-4 bg-btn-primary text-white rounded-md font-semibold text-lg flex items-center justify-center gap-2 hover:shadow-lg transition-shadow"
          >
            {copied ? (
              <>
                <Check className="w-5 h-5" />
                Copied!
              </>
            ) : (
              <>
                <Share2 className="w-5 h-5" />
                Share Letter
              </>
            )}
          </button>
          <a
            href={shareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-3 px-4 bg-btn-secondary text-primary-bg rounded-md font-semibold text-lg flex items-center justify-center gap-2 transition-colors"
          >
            <Eye className="w-5 h-5" />
            View Letter
          </a>
        </div>
      </div>

      <div className="mt-12 p-8 bg-secondary-bg rounded-lg shadow-inner text-center">
        <h3 className="text-2xl font-bold text-primary mb-3">Save Your Letters</h3>
        <p className="text-secondary mb-6">
          {user ? "This letter is saved to your dashboard because you are the sender." : "Create a free account or log in to save this letter and manage all your correspondence in one place."}
        </p>
        {user ? (
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-btn-secondary text-white font-bold py-3 px-8 rounded-lg text-lg hover:shadow-xl transition-all transform hover:scale-105 inline-flex items-center gap-2"
          >
            <LayoutDashboard className="w-5 h-5" />
            Go to Dashboard
          </button>
        ) : (
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="bg-btn-primary text-white font-bold py-3 px-8 rounded-lg text-lg hover:shadow-xl transition-all transform hover:scale-105 inline-flex items-center gap-2"
          >
            <Save className="w-5 h-5" />
            Sign Up or Log In
          </button>
        )}
      </div>

      <button
        onClick={() => {
          localStorage.removeItem('lastFinalizedShareCode');
          router.push('/');
        }}
        className="w-full mt-8 py-4 bg-btn-secondary text-primary-bg rounded-md font-semibold text-lg  transition-colors"
      >
        Create Another Letter
      </button>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        title="Save Your Letter"
        description="Sign up for a free account to keep this letter and manage all your future correspondence."
      />
    </div>
  );
}