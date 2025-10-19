import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  console.log("--- AUTH CALLBACK START ---");
  const requestUrl = new URL(request.url);
  console.log(`Callback URL: ${requestUrl.toString()}`);

  const code = requestUrl.searchParams.get("code");
  const tempId = requestUrl.searchParams.get("temp_id");
  const shareCode = requestUrl.searchParams.get("share_code");

  console.log(`Received code: ${code ? "Present" : "Missing"}`);
  console.log(`Received temp_id: ${tempId}`);
  console.log(`Received share_code: ${shareCode}`);

  if (code) {
    console.log("Code is present, proceeding with session exchange.");
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
      console.error("!!! Supabase session exchange error:", sessionError.message);
      const errorUrl = new URL("/error", request.url);
      console.log(`Redirecting to error page: ${errorUrl.toString()}`);
      console.log("--- AUTH CALLBACK END ---");
      return NextResponse.redirect(errorUrl);
    }

    if (session) {
      console.log("Session successfully created. User authenticated.");
      // Handle sender flow: associate letter with the new user.
      if (tempId) {
        console.log(`Associating letter with temp_id: ${tempId} to user: ${session.user.id}`);
        const { error } = await supabase
          .from("letters")
          .update({ sender_id: session.user.id })
          .eq("temp_id", tempId);

        if (error) {
          console.error("!!! Error updating letter with sender ID:", error.message);
        } else {
          console.log("Successfully associated letter with sender.");
        }
      }
      // Handle recipient flow: associate letter with the new user.
      else if (shareCode) {
        console.log(`Associating letter with share_code: ${shareCode} to user: ${session.user.id}`);
        const { error } = await supabase
          .from("letters")
          .update({ recipient_id: session.user.id })
          .eq("share_code", shareCode);

        if (error) {
          console.error("!!! Error updating letter with recipient ID:", error.message);
        } else {
          console.log("Successfully associated letter with recipient.");
        }
      }
      // Only redirect to the dashboard if the session was successfully created.
      const dashboardUrl = new URL("/dashboard", request.url);
      console.log(`Redirecting to dashboard: ${dashboardUrl.toString()}`);
      console.log("--- AUTH CALLBACK END ---");
      return NextResponse.redirect(dashboardUrl);
    }
  }

  // If there is no code or the session creation fails, redirect to the homepage.
  console.log("Condition failed: No code present or session creation failed. Redirecting to homepage.");
  const homeUrl = new URL("/", request.url);
  console.log(`Redirecting to: ${homeUrl.toString()}`);
  console.log("--- AUTH CALLBACK END ---");
  return NextResponse.redirect(homeUrl);
}