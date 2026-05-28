"use client"

import { useEffect } from "react"
import { Loader2, Scale } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

function getSafeRedirectPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return null
  }

  return value
}

function getLoginErrorUrl(error: string, description?: string) {
  const url = new URL("/login", window.location.origin)
  url.searchParams.set("error", error)
  if (description) {
    url.searchParams.set("error_description", description)
  }
  return url.toString()
}

function getPostAuthRedirectUrl(searchParams: URLSearchParams, hashParams: URLSearchParams) {
  const type = hashParams.get("type") || searchParams.get("type")
  if (type === "recovery") {
    return "/settings?reset_password=true"
  }

  let promoCode = searchParams.get("promo")
  let checkoutPlan = searchParams.get("plan")
  let checkoutInterval = searchParams.get("interval") || "monthly"
  let redirectPath = getSafeRedirectPath(searchParams.get("redirect"))

  const nextUrl = searchParams.get("next")
  if (nextUrl) {
    try {
      const parsedNext = new URL(nextUrl)
      promoCode ||= parsedNext.searchParams.get("promo")
      checkoutPlan ||= parsedNext.searchParams.get("plan")
      checkoutInterval = parsedNext.searchParams.get("interval") || checkoutInterval
      redirectPath ||= getSafeRedirectPath(parsedNext.searchParams.get("redirect"))
    } catch {
      // Ignore malformed next URLs and fall back to the dashboard.
    }
  }

  if (checkoutPlan) {
    const url = new URL("/dashboard", window.location.origin)
    url.searchParams.set("checkout_plan", checkoutPlan)
    url.searchParams.set("checkout_interval", checkoutInterval)
    return url.toString()
  }

  const url = new URL(redirectPath || "/dashboard", window.location.origin)
  if (promoCode) {
    url.searchParams.set("promo", promoCode)
  }
  return url.toString()
}

export default function AuthSessionPage() {
  useEffect(() => {
    async function completeSession() {
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""))
      const searchParams = new URLSearchParams(window.location.search)
      const accessToken = hashParams.get("access_token")
      const refreshToken = hashParams.get("refresh_token")

      if (!accessToken || !refreshToken) {
        window.location.replace(
          getLoginErrorUrl(
            "auth_failed",
            "The sign-in link did not include the required authentication token."
          )
        )
        return
      }

      const supabase = createClient()
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      })

      if (error) {
        window.location.replace(getLoginErrorUrl("auth_failed", error.message))
        return
      }

      window.location.replace(getPostAuthRedirectUrl(searchParams, hashParams))
    }

    void completeSession()
  }, [])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-muted/30 p-4 text-center">
      <div className="flex items-center gap-2">
        <Scale className="h-8 w-8 text-primary" />
        <span className="text-2xl font-bold">BidVet</span>
      </div>
      <div className="flex items-center gap-3 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Completing sign in...</span>
      </div>
    </div>
  )
}
