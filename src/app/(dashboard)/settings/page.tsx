import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ApiKeyForm } from "@/components/settings/api-key-form"
import { PasswordSetupForm } from "@/components/settings/password-setup-form"
import { BillingSection } from "@/components/settings/billing-section"
import { TrainingDataSettings } from "@/components/settings/training-data-settings"
import { TeamSettings } from "@/components/settings/team-settings"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { canUseBYOK, getHandshakeStatus } from "@/lib/utils/subscription"
import type { PlanType, BillingCycle, Profile, OrganizationRole } from "@/types"

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

  // Fetch organization and user's role if they're part of a team
  let organization = null
  let userRole: OrganizationRole | null = null

  const { data: membership } = await supabase
    .from("organization_members")
    .select(`
      role,
      organization:organizations (
        id,
        name,
        slug,
        max_members
      )
    `)
    .eq("user_id", user.id)
    .single()

  if (membership) {
    organization = membership.organization as any
    userRole = membership.role as OrganizationRole
  }

  const hasApiKey = !!profile?.openai_api_key_encrypted
  const showByokSection = profile ? canUseBYOK(profile as Profile) : false
  const handshakeStatus = profile ? getHandshakeStatus(profile as Profile) : null
  const isTeamPlanUser = profile?.plan === "team" || profile?.plan === "enterprise"

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
            creditBalance={profile.credit_balance || 0}
            hasApiKey={hasApiKey}
            stripeCustomerId={profile.stripe_customer_id}
            promoCode={profile.promo_code}
            promoAppliedAt={profile.promo_applied_at}
          />
        )}

        {/* Team Settings - Show for team/enterprise plan users or if already in a team */}
        {(isTeamPlanUser || organization) && (
          <TeamSettings
            organization={organization}
            userRole={userRole}
            currentUserId={user.id}
          />
        )}

        {/* API Key Form - Only show to HANDSHAKE users or grandfathered BYOK users */}
        {showByokSection && (
          <ApiKeyForm
            hasExistingKey={hasApiKey}
            isHandshakeUser={handshakeStatus?.isHandshake || false}
            handshakeDaysRemaining={handshakeStatus?.daysRemaining || 0}
            handshakeFreePeriodExpired={!handshakeStatus?.isFreePeriodActive && handshakeStatus?.isHandshake}
          />
        )}

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

        {/* Training Data Contributions */}
        <TrainingDataSettings
          initialOptIn={profile?.training_data_opt_in || false}
          initialContributionCount={profile?.training_data_contribution_count || 0}
        />
      </div>
    </div>
  )
}
