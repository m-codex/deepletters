"use client";

import { useState, useEffect } from "react";

const UNLOCK_KEY = "site_unlocked";

interface LockScreenProps {
  // NOTE: This approach exposes the site password to the client-side code.
  // This is a security risk and is only acceptable for a temporary,
  // low-security lock screen as requested.
  // For production use, a server-side check (e.g., via middleware or an API route) is required.
  sitePassword?: string;
}

export default function LockScreen({ sitePassword }: LockScreenProps) {
  // Initialize state based on sessionStorage to avoid "flash of unlocked content".
  // On the server, it will always be locked if a password is set.
  // On the client, it will be unlocked if the session key is present.
  // This will cause a hydration mismatch, which is acceptable for this use case
  // as it prevents the content from flashing.
  const [unlocked, setUnlocked] = useState(() => {
    if (typeof window === 'undefined' || !sitePassword) {
      return !sitePassword;
    }
    return sessionStorage.getItem(UNLOCK_KEY) === 'true';
  });

  const [password, setPassword] = useState("");

  // This effect is a fallback and ensures we handle the case where
  // the component mounts on the client without the server render,
  // or if the sitePassword prop changes.
  useEffect(() => {
    if (!sitePassword) {
      setUnlocked(true);
      return;
    }
    const isUnlocked = sessionStorage.getItem(UNLOCK_KEY) === "true";
    if (isUnlocked) {
      setUnlocked(true);
    }
  }, [sitePassword]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === sitePassword) {
      sessionStorage.setItem(UNLOCK_KEY, "true");
      setUnlocked(true);
    } else {
      alert("Incorrect password");
      setPassword("");
    }
  };

  if (unlocked) {
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
