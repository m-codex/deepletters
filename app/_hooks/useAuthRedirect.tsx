"use client";

import { useEffect, useState } from "react";

const TEMP_ID_STORAGE_KEY = "tempId";

export function useAuthRedirect(shareCode?: string) {
  const [redirectTo, setRedirectTo] = useState<string | null>(null);

  useEffect(() => {
    const tempId = localStorage.getItem(TEMP_ID_STORAGE_KEY);
    let baseRedirectUrl: string;

    baseRedirectUrl = process.env.NEXT_PUBLIC_VERCEL_URL
      ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}/auth/confirm`
      : `${window.location.origin}/auth/confirm`;

    const url = new URL(baseRedirectUrl);
    url.searchParams.set("next", "/dashboard");

    if (tempId) {
      url.searchParams.set("temp_id", tempId);
    }

    if (shareCode) {
      url.searchParams.set("share_code", shareCode);
    }
    setRedirectTo(url.toString());
  }, [shareCode]);

  return redirectTo;
}
