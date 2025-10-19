"use client";

import { useEffect, useState } from "react";

const TEMP_ID_STORAGE_KEY = "tempId";

export function useAuthRedirect(shareCode?: string) {
  const [redirectTo, setRedirectTo] = useState<string | null>(null);

  useEffect(() => {
    const tempId = localStorage.getItem(TEMP_ID_STORAGE_KEY);
    let siteUrl: string;

    // For Vercel deployments, use the NEXT_PUBLIC_VERCEL_URL environment variable.
    // This is more reliable than window.location.origin.
    // The protocol (https://) needs to be added manually.
    if (process.env.NEXT_PUBLIC_VERCEL_URL) {
      siteUrl = `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
      console.log("useAuthRedirect: Using Vercel URL:", siteUrl);
    } else {
      // Fallback for local development or other environments.
      siteUrl = window.location.origin;
      console.log("useAuthRedirect: Using window.location.origin:", siteUrl);
    }

    const baseRedirectUrl = `${siteUrl}/auth/callback`;
    const url = new URL(baseRedirectUrl);

    // Append temp_id for senders or share_code for recipients.
    // These will be read by the server-side callback.
    if (tempId) {
      url.searchParams.set("temp_id", tempId);
    } else if (shareCode) {
      url.searchParams.set("share_code", shareCode);
    }

    const finalRedirectUrl = url.toString();
    console.log("useAuthRedirect: Final redirectTo URL:", finalRedirectUrl);
    setRedirectTo(finalRedirectUrl);
  }, [shareCode]);

  return redirectTo;
}
