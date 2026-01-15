import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import { PasswordSetupBanner } from "@/components/dashboard/password-setup-banner"
import { LowCreditsBanner } from "@/components/shared/low-credits-banner"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Fetch profile to check onboarding status and plan
  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed, password_set, plan, subscription_status, openai_api_key_encrypted, comparisons_used, credit_balance")
    .eq("id", user.id)
    .single()

  // Get current path to avoid redirect loop
  const headersList = await headers()
  const pathname = headersList.get("x-pathname") || ""
  const isOnboardingPage = pathname.includes("/onboarding")

  // Redirect to onboarding if not completed (and not already on onboarding page)
  if (profile && !profile.onboarding_completed && !isOnboardingPage) {
    redirect("/onboarding")
  }

  const showPasswordBanner = profile && !profile.password_set && !isOnboardingPage

  const planInfo = profile ? {
    plan: profile.plan || 'free',
    isActive: profile.subscription_status === 'active',
    hasApiKey: !!profile.openai_api_key_encrypted,
    comparisonsUsed: profile.comparisons_used || 0,
    creditBalance: profile.credit_balance || 0,
  } : undefined

  // Show low credits banner for credit-based users with 2 or fewer comparisons left
  const isSubscriptionActive = profile?.subscription_status === 'active'
  const hasApiKey = !!profile?.openai_api_key_encrypted
  const creditBalance = profile?.credit_balance || 0
  const showLowCreditsBanner = !isSubscriptionActive && !hasApiKey && creditBalance > 0 && creditBalance <= 2 && !isOnboardingPage

  return (
    <div className="min-h-screen bg-muted/30">
      <DashboardHeader userEmail={user.email} planInfo={planInfo} />
      {showPasswordBanner && <PasswordSetupBanner />}
      {showLowCreditsBanner && <LowCreditsBanner creditBalance={creditBalance} />}
      <main className="container py-8">{children}</main>
    </div>
  )
}
