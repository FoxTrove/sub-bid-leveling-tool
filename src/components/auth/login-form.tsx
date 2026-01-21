"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Mail, CheckCircle2, Lock } from "lucide-react"
import { toast } from "sonner"

interface LoginFormProps {
  promoCode?: string
  plan?: "pro" | "team"
  interval?: "monthly" | "annual"
}

export function LoginForm({ promoCode, plan, interval }: LoginFormProps) {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSent, setIsSent] = useState(false)
  const [activeTab, setActiveTab] = useState<"magic" | "password">("magic")

  // Pre-fill email from landing page and store promo code/plan
  useEffect(() => {
    const savedEmail = sessionStorage.getItem("bidvet_email")
    if (savedEmail) {
      setEmail(savedEmail)
      sessionStorage.removeItem("bidvet_email")
    }

    // Store promo code for use during onboarding
    if (promoCode) {
      sessionStorage.setItem("bidvet_promo_code", promoCode)
    }

    // Store plan selection for checkout redirect after auth
    if (plan) {
      sessionStorage.setItem("bidvet_checkout_plan", plan)
      sessionStorage.setItem("bidvet_checkout_interval", interval || "monthly")
    }
  }, [promoCode, plan, interval])

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const supabase = createClient()

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error

      setIsSent(true)
      toast.success("Magic link sent! Check your email.")
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to send magic link"
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const supabase = createClient()

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          throw new Error("Invalid email or password")
        }
        throw error
      }

      toast.success("Signed in successfully!")
      router.push("/dashboard")
      router.refresh()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to sign in"
      )
    } finally {
      setIsLoading(false)
    }
  }

  if (isSent) {
    return (
      <div className="space-y-6 text-center">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle2 className="h-8 w-8 text-primary" />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Check your email</h2>
          <p className="text-muted-foreground">
            We sent a magic link to <strong>{email}</strong>
          </p>
          <p className="text-sm text-muted-foreground">
            Click the link in the email to sign in.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setIsSent(false)}
          className="w-full"
        >
          Use a different email
        </Button>
      </div>
    )
  }

  return (
    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "magic" | "password")} className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="magic">Magic Link</TabsTrigger>
        <TabsTrigger value="password">Password</TabsTrigger>
      </TabsList>

      <TabsContent value="magic" className="mt-6">
        <form onSubmit={handleMagicLink} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email-magic">Email address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email-magic"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="pl-10"
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              "Send Magic Link"
            )}
          </Button>

          <Alert>
            <AlertDescription className="text-sm">
              We&apos;ll send you a magic link to sign in. No password needed.
            </AlertDescription>
          </Alert>
        </form>
      </TabsContent>

      <TabsContent value="password" className="mt-6">
        <form onSubmit={handlePasswordLogin} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email-password">Email address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email-password"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className="pl-10"
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </Button>

          <div className="text-center">
            <Link
              href="/reset-password"
              className="text-sm text-muted-foreground hover:text-foreground hover:underline"
            >
              Forgot your password?
            </Link>
          </div>
        </form>
      </TabsContent>
    </Tabs>
  )
}
