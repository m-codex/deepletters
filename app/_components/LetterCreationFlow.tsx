"use client";

import { usePathname, useParams, useRouter } from 'next/navigation';
import { LetterProvider } from './LetterContext';
import { useLetterData } from './useLetterData';
import { Clock } from 'lucide-react';
import { useLayoutEffect, useEffect, useState } from 'react';

function CountdownTimer({ finalizedAt }: { finalizedAt: string }) {
  const calculateTimeLeft = () => {
    const finalizedDate = new Date(finalizedAt);
    const now = new Date();
    const diff = finalizedDate.getTime() + 24 * 60 * 60 * 1000 - now.getTime();

    if (diff <= 0) {
      return { hours: 0, minutes: 0, seconds: 0 };
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    return { hours, minutes, seconds };
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setTimeout(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    return () => clearTimeout(timer);
  });

  return (
    <div className="fixed top-4 right-4 bg-yellow-500 text-black p-4 rounded-lg shadow-lg flex items-center gap-2">
      <Clock className="w-6 h-6" />
      <div>
        <div className="font-bold">Time to edit remaining:</div>
        <div>{`${timeLeft.hours}h ${timeLeft.minutes}m ${timeLeft.seconds}s`}</div>
      </div>
    </div>
  );
}

function LetterCreationLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { letterData, loading } = useLetterData();
  const { shareCode } = useParams<{ shareCode?: string }>();

  useEffect(() => {
    const lastFinalizedShareCode = localStorage.getItem('lastFinalizedShareCode');
    if (lastFinalizedShareCode && !shareCode) {
      router.replace('/');
    }
  }, [router, shareCode]);

  useLayoutEffect(() => {
    const editSteps = ['/write', '/voice', '/music', '/preview'];
    const currentPath = pathname.replace(`/edit/${letterData.shareCode}`, '').replace('/create', '');

    if (letterData.finalized_at && editSteps.includes(currentPath)) {
        router.replace(letterData.shareCode ? `/manage/${letterData.management_token}` : '/create/share');
    }
  }, [letterData, pathname, router]);

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTo(0, 0);
    document.body.scrollTo(0, 0);
  }, [pathname]);

  const currentPath = pathname.replace(`/edit/${letterData.shareCode}`, '').replace('/create', '');
  const stepIndex = ['/write', '/voice', '/music', '/preview', '/share'].indexOf(currentPath);
  const step = stepIndex + 1;


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary-bg">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-btn-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
       {letterData.finalized_at && <CountdownTimer finalizedAt={letterData.finalized_at} />}
      <div className="container mx-auto px-4 sm:px-6 py-8">

        <div className="mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            {[1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                className={`h-2 rounded-full transition-all duration-300 ${
                  s === step ? 'w-12 bg-btn-primary' : s < step ? 'w-8 bg-btn-primary' : 'w-8 bg-secondary-bg'
                }`}
              />
            ))}
          </div>
          
        </div>
        {children}
      </div>
    </div>
  );
}

export default function LetterCreationFlow({ children }: { children: React.ReactNode }) {
  const { shareCode } = useParams<{ shareCode?: string }>();
  return (
    <LetterProvider shareCode={shareCode}>
      <LetterCreationLayout>{children}</LetterCreationLayout>
    </LetterProvider>
  );
}
