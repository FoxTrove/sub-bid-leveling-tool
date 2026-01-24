"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"

// Bot filter page - bots don't execute JS, so they never reach /welcome
// This prevents email preview bots (Outlook, Gmail) from inflating analytics
export default function VIPBotFilterPage() {
  const params = useParams()
  const router = useRouter()
  const emailId = params.id as string

  useEffect(() => {
    // JS redirect to welcome page - bots won't execute this
    router.replace(`/vip/${emailId}/welcome`)
  }, [emailId, router])

  // Minimal content - no tracking here
  return null
}
