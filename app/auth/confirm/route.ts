import { type EmailOtpType } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/";
  const temp_id = searchParams.get("temp_id");
  const share_code = searchParams.get("share_code");

  const redirectTo = request.nextUrl.clone();
  redirectTo.pathname = next;
  redirectTo.searchParams.delete("token_hash");
  redirectTo.searchParams.delete("type");
  redirectTo.searchParams.delete("next");
  redirectTo.searchParams.delete("temp_id");
  redirectTo.searchParams.delete("share_code");

  if (token_hash && type) {
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
      error,
    } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });

    if (!error && session) {
      if (temp_id) {
        const { error: updateError } = await supabase
          .from("letters")
          .update({ sender_id: session.user.id })
          .eq("temp_id", temp_id);

        if (updateError) {
          console.error("Error updating letter with user ID:", updateError);
          redirectTo.pathname = "/error";
          return NextResponse.redirect(redirectTo);
        }
      } else if (share_code) {
        const { error: updateError } = await supabase
          .from("letters")
          .update({ recipient_id: session.user.id })
          .eq("share_code", share_code);

        if (updateError) {
          console.error("Error updating letter with user ID:", updateError);
          redirectTo.pathname = "/error";
          return NextResponse.redirect(redirectTo);
        }
      }
    } else if (error) {
      console.error("Error verifying OTP:", error);
      redirectTo.pathname = "/error";
      return NextResponse.redirect(redirectTo);
    }
  }

  return NextResponse.redirect(redirectTo);
}
