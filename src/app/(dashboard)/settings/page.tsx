import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ApiKeyForm } from "@/components/settings/api-key-form"
import { TrialBanner } from "@/components/dashboard/trial-banner"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getTrialDaysRemaining } from "@/lib/utils/format"

export default async function SettingsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  const hasApiKey = !!profile?.openai_api_key_encrypted
  const daysRemaining = profile
    ? getTrialDaysRemaining(profile.trial_started_at)
    : 0

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="mt-2 text-muted-foreground">
          Manage your account and API settings
        </p>
      </div>

      {profile && (
        <TrialBanner
          trialStartedAt={profile.trial_started_at}
          hasOwnApiKey={hasApiKey}
        />
      )}

      <div className="space-y-6">
        {/* Trial Status Card */}
        <Card>
          <CardHeader>
            <CardTitle>Trial Status</CardTitle>
            <CardDescription>Your current subscription status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className="font-medium">
                  {hasApiKey
                    ? "Using your own API key"
                    : daysRemaining > 0
                      ? "Trial active"
                      : "Trial expired"}
                </span>
              </div>
              {!hasApiKey && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Days remaining</span>
                  <span className="font-medium">{daysRemaining}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* API Key Form */}
        <ApiKeyForm hasExistingKey={hasApiKey} />

        {/* Account Info */}
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>Your account information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email</span>
                <span className="font-medium">{user.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Member since</span>
                <span className="font-medium">
                  {profile
                    ? new Date(profile.created_at).toLocaleDateString()
                    : "-"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
