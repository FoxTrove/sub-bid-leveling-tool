import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { type EmailOtpType } from "@supabase/supabase-js"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const origin = requestUrl.origin

  const getSafeRedirectPath = (value: string | null) => {
    if (!value || !value.startsWith("/") || value.startsWith("//")) {
      return null
    }

    return value
  }

  const redirectToLoginError = (error: string, description?: string) => {
    const loginUrl = new URL("/login", origin)
    loginUrl.searchParams.set("error", error)
    if (description) {
      loginUrl.searchParams.set("error_description", description)
    }
    return NextResponse.redirect(loginUrl)
  }

  const redirectToLoginErrorUrl = (error: string, description?: string) => {
    const loginUrl = new URL("/login", origin)
    loginUrl.searchParams.set("error", error)
    if (description) {
      loginUrl.searchParams.set("error_description", description)
    }
    return loginUrl.toString()
  }

  const forwardFragmentSession = (fallbackUrl: string) => {
    const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Completing sign in...</title>
  </head>
  <body>
    <p>Completing sign in...</p>
    <script>
      (function () {
        var hash = window.location.hash || "";
        if (hash && (hash.indexOf("access_token=") !== -1 || hash.indexOf("refresh_token=") !== -1)) {
          var target = new URL("/auth/session", window.location.origin);
          target.search = window.location.search;
          target.hash = hash;
          window.location.replace(target.toString());
          return;
        }

        window.location.replace(${JSON.stringify(fallbackUrl)});
      })();
    </script>
    <noscript>
      JavaScript is required to complete this sign-in link. Please enable JavaScript and request a new magic link.
    </noscript>
  </body>
</html>`

    return new NextResponse(html, {
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
      },
    })
  }

  const providerError = requestUrl.searchParams.get("error")
  const providerErrorDescription = requestUrl.searchParams.get("error_description")
  if (providerError) {
    console.error("[Auth Callback] provider returned error:", {
      error: providerError,
      description: providerErrorDescription,
    })
    return redirectToLoginError(providerError, providerErrorDescription || undefined)
  }

  // Handle token_hash flow (from email templates)
  const token_hash = requestUrl.searchParams.get("token_hash")
  const type = requestUrl.searchParams.get("type") as EmailOtpType | null

  // Handle code flow (PKCE)
  const code = requestUrl.searchParams.get("code")

  // Debug logging
  console.log("[Auth Callback] Received params:", {
    hasTokenHash: !!token_hash,
    type,
    hasCode: !!code,
    fullUrl: request.url,
  })

  // Extract promo code and checkout info - check direct param first, then parse from 'next' URL
  let promoCode = requestUrl.searchParams.get("promo")
  let checkoutPlan = requestUrl.searchParams.get("plan")
  let checkoutInterval = requestUrl.searchParams.get("interval") || "monthly"
  let redirectPath = getSafeRedirectPath(requestUrl.searchParams.get("redirect"))

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
      if (!redirectPath) {
        redirectPath = getSafeRedirectPath(parsedNext.searchParams.get("redirect"))
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

  const getPostAuthRedirectUrl = () => {
    const checkoutUrl = getCheckoutRedirectUrl()
    if (checkoutUrl) {
      return checkoutUrl
    }

    if (redirectPath) {
      return new URL(redirectPath, origin).toString()
    }

    return buildRedirectUrl("/dashboard")
  }

  // Try token_hash flow first (from custom email templates)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })

    if (error) {
      console.error("[Auth Callback] token_hash verification failed:", error.message)
    }

    if (!error) {
      // For password recovery, redirect to settings to set new password
      if (type === "recovery") {
        return NextResponse.redirect(`${origin}/settings?reset_password=true`)
      }
      return NextResponse.redirect(getPostAuthRedirectUrl())
    }
  }

  // Try code flow (PKCE - default Supabase flow)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error("[Auth Callback] code exchange failed:", error.message)
    }

    if (!error) {
      // Check if this is a recovery flow
      const recoveryType = requestUrl.searchParams.get("type")
      if (recoveryType === "recovery") {
        return NextResponse.redirect(`${origin}/settings?reset_password=true`)
      }
      return NextResponse.redirect(getPostAuthRedirectUrl())
    }
  }

  // Check if user is already authenticated (session may have been set by Supabase's /verify endpoint)
  // This handles cases where PKCE code exchange fails due to cross-tab/browser issues
  // but Supabase already authenticated the user
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    return NextResponse.redirect(getPostAuthRedirectUrl())
  }

  // If there's no valid auth params or an error, redirect to login with error
  return forwardFragmentSession(
    redirectToLoginErrorUrl(
      "auth_failed",
      "The sign-in link did not include the required authentication token."
    )
  )
}
