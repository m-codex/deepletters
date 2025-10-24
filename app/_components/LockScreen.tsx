"use client";

import { useState, useEffect } from "react";

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
  const [isUnlocked, setIsUnlocked]_useState < boolean | null > null; // null means 'checking'

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm">
      <div className="bg-gray-800 p-8 rounded-lg shadow-xl border border-gray-700">
        <h1 className="text-2xl font-bold text-white mb-4 text-center">Enter Password</h1>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 mb-4 text-white bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Password"
            autoFocus
          />
          <button
            type="submit"
            className="w-full px-4 py-2 font-bold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
          >
            Unlock
          </button>
        </form>
      </div>
    </div>
  );
}
