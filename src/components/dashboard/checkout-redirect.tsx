"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"

export function CheckoutRedirect() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isRedirecting, setIsRedirecting] = useState(false)

  useEffect(() => {
    // Check URL params first (from magic link callback), then sessionStorage (from password login)
    let plan = searchParams.get("checkout_plan") || sessionStorage.getItem("bidvet_checkout_plan")
    let interval = searchParams.get("checkout_interval") || sessionStorage.getItem("bidvet_checkout_interval") || "monthly"

    // Clear URL params if present
    if (searchParams.get("checkout_plan")) {
      const url = new URL(window.location.href)
      url.searchParams.delete("checkout_plan")
      url.searchParams.delete("checkout_interval")
      window.history.replaceState({}, "", url.toString())
    }

    if (plan && (plan === "pro" || plan === "team" || plan === "basic")) {
      setIsRedirecting(true)

      // Clear the stored plan
      sessionStorage.removeItem("bidvet_checkout_plan")
      sessionStorage.removeItem("bidvet_checkout_interval")

      // Redirect to checkout
      fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, interval }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.url) {
            window.location.href = data.url
          } else {
            setIsRedirecting(false)
            router.push("/pricing?error=checkout_failed")
          }
        })
        .catch(() => {
          setIsRedirecting(false)
          router.push("/pricing?error=checkout_failed")
        })
    }
  }, [router, searchParams])

  if (isRedirecting) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-lg font-medium">Redirecting to checkout...</p>
        </div>
      </div>
    )
  }

  return null
}
