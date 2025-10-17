"use client";

import { useEffect, useState } from "react";

const TEMP_ID_STORAGE_KEY = "tempId";

export function useAuthRedirect() {
  const [redirectTo, setRedirectTo] = useState<string | null>(null);

  useEffect(() => {
    const tempId = localStorage.getItem(TEMP_ID_STORAGE_KEY);
    let baseRedirectUrl: string;

    if (tempId) {
      // If a temp_id exists, the user has just created a letter.
      // We want to redirect them to the dashboard after they sign up.
      baseRedirectUrl = process.env.NEXT_PUBLIC_VERCEL_URL
        ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}/dashboard`
        : `${window.location.origin}/dashboard`;

      const url = new URL(baseRedirectUrl);
      url.searchParams.set("temp_id", tempId);
      setRedirectTo(url.toString());
    } else {
      // If there's no temp_id, this is a normal login/signup.
      // The callback will handle the redirect.
      baseRedirectUrl = process.env.NEXT_PUBLIC_VERCEL_URL
        ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}/auth/callback`
        : `${window.location.origin}/auth/callback`;
      setRedirectTo(baseRedirectUrl);
    }
  }, []);

  return redirectTo;
}