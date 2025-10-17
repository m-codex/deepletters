"use client";

import { usePathname, useParams, useRouter } from 'next/navigation';
import { LetterProvider } from './LetterContext';
import { useLetterData } from './useLetterData';
import { useLayoutEffect } from 'react';

function LetterCreationLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { letterData, loading } = useLetterData();
  const { shareCode } = useParams<{ shareCode?: string }>();

  useLayoutEffect(() => {
    const lastFinalizedShareCode = localStorage.getItem('lastFinalizedShareCode');
    if (lastFinalizedShareCode && !shareCode) {
      router.replace('/');
    }
  }, [router, shareCode]);

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTo(0, 0);
    document.body.scrollTo(0, 0);
  }, [pathname]);

  const steps = ['/write', '/music', '/preview'];
  const currentPath = pathname.replace('/create', '');
  const stepIndex = steps.indexOf(currentPath);
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
      <div className="container mx-auto px-4 sm:px-6 py-8">

        <div className="mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            {[1, 2, 3].map((s) => (
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