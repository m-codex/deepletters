"use client";

import { Mail, Music, Mic, QrCode, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function LandingPage() {
  const router = useRouter();
  const [honeypot, setHoneypot] = useState('');


  useEffect(() => {
    localStorage.removeItem('lastFinalizedShareCode');
  }, []);


  return (
    <div className="min-h-screen">


      <main>
        <section className="container mx-auto px-6 py-16 sm:py-24 text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-secondary-bg rounded-full mb-8">
          <Mail className="w-12 h-12 text-btn-primary" />
        </div>
          <h1 className="text-4xl md:text-6xl text-white mb-6 leading-tight text-balance">
            Send meaningful letters
          </h1>
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
          <div className="max-2-3xl mx-auto rounded-t-4xl p-4 md:p-8 bg-linear-to-t from-primary-bg to-primary">
          <p className="text-xl text-secondary mb-12 max-w-2xl mx-auto text-balance">
            Combine your words, voice, and more to make your message memorable and impactful.
          </p>
          </div>
         

          <button
            onClick={() => {
              if (honeypot) {
                return;
              }
              router.push('/create/write');
            }}
            className="-mt-8 px-8 py-4 bg-btn-primary text-white rounded-md font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            Create Your Letter
          </button>
          <p className="mt-6 text-sm text-secondary">
            Free to create • Available online for 7 days • Download and keep forever
          </p>
        </section>

        <section className="container mx-auto px-6 py-20">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            

            <FeatureCard
              icon={<Mail className="w-8 h-8" />}
              title="Write Your Heart"
              description="Express your feelings with words that matter"
            />
            <FeatureCard
              icon={<Mic className="w-8 h-8" />}
              title="Add Your Voice"
              description="Record yourself reading the letter (optional)"
            />
            <FeatureCard
              icon={<Music className="w-8 h-8" />}
              title="Add Background Soundtrack"
              description="Add background music to give your message more depth (optional)"
            />
            <FeatureCard
              icon={<QrCode className="w-8 h-8" />}
              title="Share Instantly"
              description="Share via link and download it"
            />
          </div>
        </section>

        <section className="container mx-auto px-6">
          <div className="container mx-auto px-6 py-20 text-center bg-secondary-bg rounded-md">
          <Clock className="w-16 h-16 mx-auto mb-6 text-btn-primary" />
          <h2 className="text-4xl text-primary mb-4">Available Online for 7 Days</h2>
           <p className="text-lg text-secondary max-w-2xl mx-auto mb-8">
            Every letter is free and available online for 7 days.<br />
            <strong>Want to keep it forever?</strong> Download your letter within that time to save it as an encrypted file.<br />
            Open the file anytime using the letter viewer on deepletters.org.
          </p>
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
      <div className="text-btn-primary mb-4">{icon}</div>
      <h3 className="text-xl text-primary mb-2">{title}</h3>
      <p className="text-secondary">{description}</p>
    </div>
  );
}
