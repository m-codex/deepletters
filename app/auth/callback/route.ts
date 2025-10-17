import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tempId = requestUrl.searchParams.get("temp_id");

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
    } = await supabase.auth.exchangeCodeForSession(code);

    if (session && tempId) {
      const { error } = await supabase
        .from("letters")
        .update({ sender_id: session.user.id })
        .eq("temp_id", tempId);

      if (error) {
        console.error("Error updating letter with user ID:", error);
      }
    }
  }

  const redirectUrl = new URL(`${requestUrl.origin}/dashboard`);
  if (tempId) {
    redirectUrl.searchParams.set("temp_id", tempId);
  }
  return NextResponse.redirect(redirectUrl);
}