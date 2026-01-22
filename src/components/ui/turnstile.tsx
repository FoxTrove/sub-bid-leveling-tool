"use client"

import { Turnstile as TurnstileWidget } from "@marsidev/react-turnstile"
import { cn } from "@/lib/utils"

interface TurnstileProps {
  onVerify: (token: string) => void
  onError?: () => void
  onExpire?: () => void
  className?: string
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ""

export function Turnstile({ onVerify, onError, onExpire, className }: TurnstileProps) {
  // Don't render if no site key configured
  if (!SITE_KEY) {
    // In development, auto-verify to not block auth flow
    if (process.env.NODE_ENV === "development") {
      console.warn("[Turnstile] No NEXT_PUBLIC_TURNSTILE_SITE_KEY configured, skipping CAPTCHA")
    }
    return null
  }

  return (
    <div className={cn("flex justify-center", className)}>
      <TurnstileWidget
        siteKey={SITE_KEY}
        onSuccess={onVerify}
        onError={onError}
        onExpire={onExpire}
        options={{
          theme: "auto",
          size: "normal",
        }}
      />
    </div>
  )
}

// Export a hook for managing captcha state
export function useTurnstile() {
  const isCaptchaEnabled = !!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

  return {
    isCaptchaEnabled,
    // If CAPTCHA is not enabled, always allow submission
    shouldAllowSubmit: (token: string | null) => !isCaptchaEnabled || !!token,
  }
}
