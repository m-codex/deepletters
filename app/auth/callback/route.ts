import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tempId = requestUrl.searchParams.get("temp_id");
  const shareCode = requestUrl.searchParams.get("share_code");

  if (code) {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options) {
            cookieStore.set({ name, value: "", ...options });
          },
        },
      },
    );

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.exchangeCodeForSession(code);

    if (sessionError) {
      console.error("Error exchanging code for session:", sessionError);
      return NextResponse.redirect(new URL("/error", request.url));
    }

    if (session) {
      // Handle sender flow: associate letter with the new user.
      if (tempId) {
        const { error } = await supabase
          .from("letters")
          .update({ sender_id: session.user.id })
          .eq("temp_id", tempId);

        if (error) {
          console.error("Error updating letter with sender ID:", error);
        }
      }
      // Handle recipient flow: associate letter with the new user.
      else if (shareCode) {
        const { error } = await supabase
          .from("letters")
          .update({ recipient_id: session.user.id })
          .eq("share_code", shareCode);

        if (error) {
          console.error("Error updating letter with recipient ID:", error);
        }
      }
    }
  }

  // Redirect to the dashboard after successful authentication.
  return NextResponse.redirect(new URL("/dashboard", request.url));
}