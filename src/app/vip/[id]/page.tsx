"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

const VALID_EMAIL_IDS = ["1", "2", "3", "4", "5", "6"]

export default function VIPRedirectPage() {
  const params = useParams()
  const router = useRouter()
  const emailId = params.id as string

  useEffect(() => {
    // Validate email ID
    if (!VALID_EMAIL_IDS.includes(emailId)) {
      // Invalid ID, redirect to regular join page
      router.replace("/join?invite=HANDSHAKE2026")
      return
    }

    // Store attribution data in sessionStorage
    const attribution = {
      source: "instantly",
      campaign: "handshake",
      emailId: emailId,
      timestamp: new Date().toISOString(),
    }
    sessionStorage.setItem("bidvet_attribution", JSON.stringify(attribution))

    // Also set a cookie for server-side access (30 day expiry)
    document.cookie = `bidvet_attribution=${encodeURIComponent(JSON.stringify(attribution))}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`

    // Redirect to join page with invite code
    router.replace("/join?invite=HANDSHAKE2026")
  }, [emailId, router])

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
        <p className="text-slate-400">Preparing your exclusive access...</p>
      </div>
    </div>
  )
}
