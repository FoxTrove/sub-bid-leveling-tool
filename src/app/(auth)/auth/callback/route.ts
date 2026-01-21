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

  // Extract promo code and checkout info - check direct param first, then parse from 'next' URL
  let promoCode = requestUrl.searchParams.get("promo")
  let checkoutPlan = requestUrl.searchParams.get("plan")
  let checkoutInterval = requestUrl.searchParams.get("interval") || "monthly"

  // If params not directly in URL, check the 'next' param (from email template's RedirectTo)
  const nextUrl = requestUrl.searchParams.get("next")
  if (nextUrl) {
    try {
      const parsedNext = new URL(nextUrl)
      if (!promoCode) {
        promoCode = parsedNext.searchParams.get("promo")
      }
      if (!checkoutPlan) {
        checkoutPlan = parsedNext.searchParams.get("plan")
        checkoutInterval = parsedNext.searchParams.get("interval") || "monthly"
      }
    } catch {
      // Invalid URL, ignore
    }
  }

  const supabase = await createClient()

  // Build redirect URL with promo code if present
  const buildRedirectUrl = (basePath: string) => {
    const url = new URL(basePath, origin)
    if (promoCode) {
      url.searchParams.set("promo", promoCode)
    }
    return url.toString()
  }

  // Build checkout redirect URL if plan is specified
  const getCheckoutRedirectUrl = () => {
    if (checkoutPlan) {
      const url = new URL("/dashboard", origin)
      url.searchParams.set("checkout_plan", checkoutPlan)
      url.searchParams.set("checkout_interval", checkoutInterval)
      return url.toString()
    }
    return null
  }

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
      // Check if user was trying to checkout a plan
      const checkoutUrl = getCheckoutRedirectUrl()
      return NextResponse.redirect(checkoutUrl || buildRedirectUrl("/dashboard"))
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
      // Check if user was trying to checkout a plan
      const checkoutUrl = getCheckoutRedirectUrl()
      return NextResponse.redirect(checkoutUrl || buildRedirectUrl("/dashboard"))
    }
  }

  // Check if user is already authenticated (session may have been set by Supabase's /verify endpoint)
  // This handles cases where PKCE code exchange fails due to cross-tab/browser issues
  // but Supabase already authenticated the user
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    // Check if user was trying to checkout a plan
    const checkoutUrl = getCheckoutRedirectUrl()
    return NextResponse.redirect(checkoutUrl || buildRedirectUrl("/dashboard"))
  }

  // If there's no valid auth params or an error, redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
