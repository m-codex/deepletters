"use client";

import { useEffect, useState } from "react";

const TEMP_ID_STORAGE_KEY = "tempId";

export function useAuthRedirect() {
  const [redirectTo, setRedirectTo] = useState<string | null>(null);

  useEffect(() => {
    const tempId = localStorage.getItem(TEMP_ID_STORAGE_KEY);
    const baseRedirectUrl = process.env.NEXT_PUBLIC_VERCEL_URL
      ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}/auth/callback`
      : `${window.location.origin}/auth/callback`;

    if (tempId) {
      const url = new URL(baseRedirectUrl);
      url.searchParams.set("temp_id", tempId);
      setRedirectTo(url.toString());
    } else {
      setRedirectTo(baseRedirectUrl);
    }
  }, []);

  return redirectTo;
}