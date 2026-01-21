import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import { SidebarNav } from "@/components/layout/sidebar-nav"
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
    .select("onboarding_completed, password_set, plan, subscription_status, openai_api_key_encrypted, comparisons_used, credit_balance, organization_id")
    .eq("id", user.id)
    .single()

  // Check if user is part of a team/organization
  const hasTeam = !!profile?.organization_id

  // Get current path and search params to avoid redirect loop and preserve promo code
  const headersList = await headers()
  const pathname = headersList.get("x-pathname") || ""
  const fullUrl = headersList.get("x-url") || ""
  const isOnboardingPage = pathname.includes("/onboarding")

  // Redirect to onboarding if not completed (and not already on onboarding page)
  // Preserve promo code in URL if present
  if (profile && !profile.onboarding_completed && !isOnboardingPage) {
    // Extract promo code from current URL if present
    let onboardingUrl = "/onboarding"
    try {
      const url = new URL(fullUrl)
      const promoCode = url.searchParams.get("promo")
      if (promoCode) {
        onboardingUrl = `/onboarding?promo=${encodeURIComponent(promoCode)}`
      }
    } catch {
      // If URL parsing fails, just redirect without promo
    }
    redirect(onboardingUrl)
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
      <DashboardHeader userEmail={user.email} planInfo={planInfo} hasTeam={hasTeam} />
      <SidebarNav hasTeam={hasTeam} />
      {showPasswordBanner && <PasswordSetupBanner />}
      {showLowCreditsBanner && <LowCreditsBanner creditBalance={creditBalance} />}
      <main className="md:pl-16 transition-all duration-200">
        <div className="container py-8">{children}</div>
      </main>
    </div>
  )
}
