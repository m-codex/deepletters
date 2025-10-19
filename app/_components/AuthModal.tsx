"use client";

import { useState } from "react";
import { supabase } from "@/_lib/supabase";
import { X } from "lucide-react";
import { useAuthRedirect } from "@/_hooks/useAuthRedirect";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  shareCode?: string;
}

export default function AuthModal({
  isOpen,
  onClose,
  title = "Sign In / Sign Up",
  description = "Enter your email to receive a magic link to access your dashboard.",
  shareCode,
}: AuthModalProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const redirectTo = useAuthRedirect(shareCode);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!redirectTo) {
      setError("Could not determine redirect URL.");
      return;
    }

    setError("");
    setMessage("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
      },
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage("Check your email for the magic link!");
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
      <div className="bg-secondary-bg rounded-lg shadow-2xl p-8 max-w-sm w-full relative animate-fadeInUp">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-secondary hover:text-primary transition-colors"
          aria-label="Close modal"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-2xl font-bold text-primary text-center mb-2">{title}</h2>
        <p className="text-secondary text-center mb-6">{description}</p>

        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label htmlFor="email" className="sr-only">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="w-full px-4 py-3 bg-primary-bg text-primary border border-secondary rounded-md focus:ring-2 focus:ring-btn-primary focus:border-transparent focus:outline-none transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-btn-primary text-white font-bold py-3 px-4 rounded-lg hover:bg-btn-hover disabled:bg-gray-400 transition-all transform hover:scale-105"
          >
            {loading ? 'Sending...' : 'Send Magic Link'}
          </button>
        </form>

        {message && <p className="mt-4 text-center text-green-500">{message}</p>}
        {error && <p className="mt-4 text-center text-red-500">{error}</p>}
      </div>
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeInUp {
          animation: fadeInUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}