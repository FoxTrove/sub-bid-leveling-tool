import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { type EmailOtpType } from "@supabase/supabase-js"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const origin = requestUrl.origin

  // Handle token_hash flow (from email templates)
  const token_hash = requestUrl.searchParams.get("token_hash")
  const type = requestUrl.searchParams.get("type") as EmailOtpType | null

  // Handle code flow (PKCE)
  const code = requestUrl.searchParams.get("code")

  const supabase = await createClient()

  // Try token_hash flow first (from custom email templates)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })

    if (!error) {
      // For password recovery, redirect to settings to set new password
      if (type === "recovery") {
        return NextResponse.redirect(`${origin}/settings?reset_password=true`)
      }
      return NextResponse.redirect(`${origin}/dashboard`)
    }
  }

  // Try code flow (PKCE - default Supabase flow)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Check if this is a recovery flow
      const recoveryType = requestUrl.searchParams.get("type")
      if (recoveryType === "recovery") {
        return NextResponse.redirect(`${origin}/settings?reset_password=true`)
      }
      return NextResponse.redirect(`${origin}/dashboard`)
    }
  }

  // If there's no valid auth params or an error, redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
