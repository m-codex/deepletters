"use client";

import { Mail, Music } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import AuthModal from './AuthModal'; // Assuming AuthModal is in the same directory

// Define the image URL for the background pattern
// IMPORTANT: Replace this with the URL of your own image/pattern
const backgroundImageUrl = 'https://www.transparenttextures.com/patterns/subtle-carbon.png';

export default function LandingPage() {
  const router = useRouter();
  const [honeypot, setHoneypot] = useState('');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  // Effect to handle localStorage cleanup
  useEffect(() => {
    localStorage.removeItem('lastFinalizedShareCode');
  }, []);

  // Effect to preload the background image and fade it in
  useEffect(() => {
    const img = new Image();
    img.src = backgroundImageUrl;
    img.onload = () => {
      // Once the image is loaded, set the state to trigger the fade-in
      setIsImageLoaded(true);
    };
  }, []);

  return (
    // The main container now has a dark base background color
    <div className="min-h-screen bg-[#262626]">
      <main>
        {/* HERO SECTION */}
        {/* This section has a relative positioning to act as a container for the absolute positioned background layers. */}
        {/* The overflow-hidden ensures that any decorative elements don't spill out. */}
        <section className="relative overflow-hidden container mx-auto px-6 py-16 sm:py-24 text-center">
          
          {/* Background Layer 1: CSS Radial Gradient */}
          {/* This is visible immediately. It provides the base look and feel. */}
          {/* The gradient goes from a dark gray at the center to the base background color. */}
          <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,_#4a4a4a_0%,#262626_70%)]"></div>

          {/* Background Layer 2: Image with Pattern */}
          {/* This layer sits on top of the gradient. It's initially transparent. */}
          {/* When the image loads (isImageLoaded becomes true), it fades in smoothly. */}
          <div
            style={{ backgroundImage: `url(${backgroundImageUrl})` }}
            className={`absolute inset-0 z-0 bg-center opacity-0 transition-opacity duration-1000 ease-in-out ${isImageLoaded ? 'opacity-20' : 'opacity-0'}`}
          ></div>
          
          {/* Content Layer */}
          {/* This container needs to be relative and have a z-index higher than the background layers. */}
          <div className="relative z-10">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-white/10 backdrop-blur-sm rounded-full mb-8 border border-white/20">
              <Mail className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-4xl md:text-6xl text-white font-bold mb-6 leading-tight text-balance">
              Send meaningful letters
            </h1>

            <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto text-balance">
              Combine your words and a beautiful soundtrack to make your message memorable.
            </p>

            {/* Honeypot for spam prevention - no changes needed here */}
            <div style={{ position: 'absolute', left: '-5000px', top: '-5000px' }}>
              <label htmlFor="honeypot">Please leave this field blank</label>
              <input type="text" id="honeypot" name="honeypot" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} tabIndex={-1} aria-hidden="true" />
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => {
                  if (honeypot) return;
                  router.push('/create/write');
                }}
                className="px-8 py-4 bg-white text-black rounded-md font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 ease-in-out"
              >
                Write Your Letter
              </button>
            </div>
            <p className="mt-6 text-sm text-gray-400">
              Already have an account?{' '}
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="text-white font-semibold hover:underline"
              >
                Log in
              </button>
            </p>
          </div>
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

      <footer className="container mx-auto px-6 py-12 text-center text-gray-500 text-sm">
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
    // Slightly updated card style for better contrast and a modern feel
    <div className="bg-white/5 border border-white/10 rounded-lg p-8 shadow-sm hover:shadow-lg hover:border-white/20 transition-all duration-300">
      <div className="text-white mb-4">{icon}</div>
      <h3 className="text-xl text-white font-semibold mb-2">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  );
}
