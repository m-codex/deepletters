"use client";

import { useEffect, useState } from "react";

const TEMP_ID_STORAGE_KEY = "tempId";

export function useAuthRedirect(shareCode?: string) {
  const [redirectTo, setRedirectTo] = useState<string | null>(null);

  useEffect(() => {
    const tempId = localStorage.getItem(TEMP_ID_STORAGE_KEY);
    let baseRedirectUrl: string;

    // Correctly determine the base URL for the redirect.
    // Use the Vercel URL for preview deployments, otherwise use the current window's origin.
    const siteUrl = process.env.NEXT_PUBLIC_VERCEL_URL
      ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
      : window.location.origin;

    baseRedirectUrl = `${siteUrl}/auth/callback`;

    const url = new URL(baseRedirectUrl);

    // Append temp_id for senders or share_code for recipients.
    // These will be read by the server-side callback.
    if (tempId) {
      url.searchParams.set("temp_id", tempId);
    } else if (shareCode) {
      url.searchParams.set("share_code", shareCode);
    }

    setRedirectTo(url.toString());
  }, [shareCode]);

  return redirectTo;
}
