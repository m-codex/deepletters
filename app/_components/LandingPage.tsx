"use client";

import { Mail, Music } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import AuthModal from './AuthModal';

export default function LandingPage() {
  const router = useRouter();
  const [honeypot, setHoneypot] = useState('');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);


  useEffect(() => {
    localStorage.removeItem('lastFinalizedShareCode');
  }, []);


  return (
    <div className="min-h-screen">


      <main>
        <section className="container mx-auto px-6 py-16 sm:py-24 text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-secondary-bg rounded-full mb-8">
          <Mail className="w-12 h-12 text-accent" />
        </div>
          <h1 className="font-header text-4xl md:text-6xl text-white mb-6 leading-tight text-balance">
            Say it with deepletters.org
          </h1> {/*old: Send meaningful letters */}
          

          <p className="text-xl text-gradient mb-12 max-w-2xl mx-auto text-balance">
            Combine your words and a beautiful soundtrack to make your message memorable.
          </p>

         <div style={{
            position: 'absolute',
            left: '-5000px',
            top: '-5000px'
          }}>
            <label htmlFor="honeypot">Please leave this field blank</label>
            <input
              type="text"
              id="honeypot"
              name="honeypot"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              tabIndex={-1}
              aria-hidden="true"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => {
                if (honeypot) {
                  return;
                }
                router.push('/create/write');
              }}
              className="font-text bg-gradient-primary-btn text-primary px-8 py-4 rounded-md text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              Write Your Letter
            </button>
          </div>
          <p className="mt-6 text-base text-secondary">
            or{' '}
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="text-accent hover:underline"
            >
              Log in
            </button>
          </p>
        </section>

        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          title="Log In to Your Dashboard"
          description="Enter your email to receive a magic link to access your dashboard."
        />

        <section className="container mx-auto px-6 py-20">
          <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8">

            <FeatureCard
              icon={<Mail className="w-8 h-8" />}
              title="Write Your Heart"
              description="Express your feelings with words that matter."
            />
            <FeatureCard
              icon={<Music className="w-8 h-8" />}
              title="Add a Soundtrack"
              description="Add background music to give your message more depth."
            />
          </div>
        </section>
      </main>

      <footer className="container mx-auto px-6 py-12 text-center text-secondary text-sm">
        <p>© 2025 deepletters.org • Made with love</p>
      </footer>
    </div>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="bg-secondary-bg rounded-md p-8 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="text-accent mb-4">{icon}</div>
      <h3 className="text-xl text-primary mb-2">{title}</h3>
      <p className="text-gradient">{description}</p>
    </div>
  );
}
