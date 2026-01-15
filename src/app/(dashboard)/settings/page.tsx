import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ApiKeyForm } from "@/components/settings/api-key-form"
import { PasswordSetupForm } from "@/components/settings/password-setup-form"
import { BillingSection } from "@/components/settings/billing-section"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { PlanType, BillingCycle } from "@/types"

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

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="mt-2 text-muted-foreground">
          Manage your account, billing, and API settings
        </p>
      </div>

      <div className="space-y-6">
        {/* Billing & Plan */}
        {profile && (
          <BillingSection
            plan={(profile.plan || "free") as PlanType}
            subscriptionStatus={profile.subscription_status}
            subscriptionPeriodEnd={profile.subscription_period_end}
            billingCycle={profile.billing_cycle as BillingCycle | null}
            comparisonsUsed={profile.comparisons_used || 0}
            hasApiKey={hasApiKey}
            stripeCustomerId={profile.stripe_customer_id}
          />
        )}

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
              {profile?.company_name && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Company</span>
                  <span className="font-medium">{profile.company_name}</span>
                </div>
              )}
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

        {/* Security - Password Setup */}
        <Card>
          <CardHeader>
            <CardTitle>Security</CardTitle>
            <CardDescription>
              Set up a password for easier future logins
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PasswordSetupForm hasPassword={profile?.password_set || false} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
