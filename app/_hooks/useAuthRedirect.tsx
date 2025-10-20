"use client";

import { useEffect, useState } from "react";

const TEMP_ID_STORAGE_KEY = "temp_id";

export function useAuthRedirect(shareCode?: string) {
  const [redirectTo, setRedirectTo] = useState<string | null>(null);

  useEffect(() => {
    const tempId = localStorage.getItem(TEMP_ID_STORAGE_KEY);
    let baseRedirectUrl: string;

    // Use the current window's origin to construct the redirect URL.
    // This is a reliable way to ensure the correct URL is used for all environments.
    const siteUrl = window.location.origin;
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
