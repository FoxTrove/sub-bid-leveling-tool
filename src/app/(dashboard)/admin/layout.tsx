import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { isAdminEmail } from "@/lib/admin/constants"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { DashboardHeader } from "@/components/layout/dashboard-header"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  if (!isAdminEmail(user.email)) {
    redirect("/dashboard")
  }

  // Fetch profile for header display
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, subscription_status, openai_api_key_encrypted, comparisons_used, credit_balance, organization_id")
    .eq("id", user.id)
    .single()

  const hasTeam = !!profile?.organization_id

  const planInfo = profile ? {
    plan: profile.plan || 'free',
    isActive: profile.subscription_status === 'active',
    hasApiKey: !!profile.openai_api_key_encrypted,
    comparisonsUsed: profile.comparisons_used || 0,
    creditBalance: profile.credit_balance || 0,
  } : undefined

  return (
    <div className="min-h-screen bg-slate-950">
      <DashboardHeader userEmail={user.email} planInfo={planInfo} hasTeam={hasTeam} />
      <AdminSidebar />
      <main className="pl-16 transition-all duration-200">
        <div className="p-6 md:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
