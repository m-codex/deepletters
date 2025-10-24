"use client";

import { useState, useEffect } from "react";
import { Mail } from 'lucide-react';

const UNLOCK_KEY = "site_unlocked";

interface LockScreenProps {
  // NOTE: This approach exposes the site password to the client-side code.
  // This is a security risk and is only acceptable for a temporary,
  // low-security lock screen as requested.
  // For production use, a server-side check (e.g., via middleware or an API route) is required.
  sitePassword: string;
}

export default function LockScreen({ sitePassword }: LockScreenProps) {
  const [password, setPassword] = useState("");
  const [isUnlocked, setIsUnlocked] = useState<boolean | null>(null); // null means 'checking'

  useEffect(() => {
    const unlockedInStorage = localStorage.getItem(UNLOCK_KEY) === "true";
    setIsUnlocked(unlockedInStorage);

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === UNLOCK_KEY) {
        setIsUnlocked(event.newValue === "true");
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === sitePassword) {
      localStorage.setItem(UNLOCK_KEY, "true");
      setIsUnlocked(true);
    } else {
      alert("Incorrect password");
      setPassword("");
    }
  };

  if (isUnlocked === null || isUnlocked) {
    // Render nothing while checking or if the site is unlocked.
    // This prevents the "flash" of the lock screen.
    return null;
  }

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-primary-bg">
      <div className="bg-secondary-bg p-8 rounded-lg shadow-xl">
         <div className="inline-flex items-center justify-center w-24 h-24 bg-tertiary-bg rounded-full mb-8">
          <Mail className="w-12 h-12 text-accent" />
        </div>
        <h1 className="text-2xl text-white mb-4 text-center">Enter Password</h1>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 mb-4 text-primary bg-primary-bg rounded-md focus:outline-none focus:ring-2 focus:ring-border"
            placeholder="Password"
            autoFocus
          />
          <button
            type="submit"
            className="w-full px-4 py-2 bg-gradient-primary-btn hover:opacity-90 text-primary rounded-md  transition-colors"
          >
            Unlock
          </button>
        </form>
      </div>
    </div>
  );
}
