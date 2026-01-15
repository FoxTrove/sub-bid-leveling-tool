"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export default function OnboardingPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [fullName, setFullName] = useState("")
  const [gcName, setGcName] = useState("")
  const [companyName, setCompanyName] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!fullName.trim() || !companyName.trim()) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsLoading(true)

    try {
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error("Not authenticated")
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim(),
          gc_name: gcName.trim() || null,
          company_name: companyName.trim(),
          onboarding_completed: true,
        })
        .eq("id", user.id)

      if (error) throw error

      toast.success("Profile setup complete!")
      router.push("/dashboard")
      router.refresh()
    } catch (error) {
      toast.error("Failed to save profile")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome to BidLevel</CardTitle>
          <CardDescription>
            Let&apos;s set up your account. This information will appear on your bid comparison reports.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Your Name *</Label>
              <Input
                id="fullName"
                placeholder="John Smith"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name *</Label>
              <Input
                id="companyName"
                placeholder="Smith Construction Inc."
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gcName">GC Contact Name (Optional)</Label>
              <Input
                id="gcName"
                placeholder="General Contractor contact name"
                value={gcName}
                onChange={(e) => setGcName(e.target.value)}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                If you work with a specific GC, enter their name here
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Complete Setup"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
