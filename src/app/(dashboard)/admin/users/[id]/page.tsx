import Link from "next/link"
import { notFound } from "next/navigation"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { isAdminEmail } from "@/lib/admin/constants"
import { Button } from "@/components/ui/button"
import { UserDetailCard } from "@/components/admin/users/user-detail-card"
import { UserEditForm } from "@/components/admin/users/user-edit-form"
import { CreditHistory } from "@/components/admin/users/credit-history"
import { ImpersonateButton } from "@/components/admin/users/impersonate-button"
import { ChevronLeft } from "lucide-react"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function UserDetailPage({ params }: PageProps) {
  const { id } = await params

  // Verify admin access
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  if (!authUser?.email || !isAdminEmail(authUser.email)) {
    notFound()
  }

  // Fetch user data
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/users/${id}`, {
    cache: 'no-store',
    headers: {
      cookie: (await supabase.auth.getSession()).data.session?.access_token
        ? `sb-access-token=${(await supabase.auth.getSession()).data.session?.access_token}`
        : '',
    },
  })

  // If fetch fails, use direct database query
  const adminClient = createAdminClient()

  const { data: profile, error: profileError } = await adminClient
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()

  if (profileError || !profile) {
    notFound()
  }

  // Get stats
  const [projectsResult, completedResult, documentsResult, transactionsResult, orgResult] = await Promise.all([
    adminClient
      .from('projects')
      .select('id, name, trade_type, status, created_at', { count: 'exact' })
      .eq('user_id', id)
      .order('created_at', { ascending: false })
      .limit(10),

    adminClient
      .from('projects')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', id)
      .eq('status', 'complete'),

    // Get document count via projects
    (async () => {
      const { data: userProjects } = await adminClient
        .from('projects')
        .select('id')
        .eq('user_id', id)

      if (!userProjects?.length) return { count: 0 }

      const { count } = await adminClient
        .from('bid_documents')
        .select('id', { count: 'exact', head: true })
        .in('project_id', userProjects.map(p => p.id))

      return { count: count || 0 }
    })(),

    adminClient
      .from('credit_transactions')
      .select('*')
      .eq('user_id', id)
      .order('created_at', { ascending: false })
      .limit(10),

    profile.organization_id
      ? adminClient
          .from('organizations')
          .select('id, name, slug, plan, max_members')
          .eq('id', profile.organization_id)
          .single()
      : Promise.resolve({ data: null }),
  ])

  const stats = {
    projectCount: projectsResult.count || 0,
    completedComparisons: completedResult.count || 0,
    documentCount: documentsResult.count || 0,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="text-slate-400 hover:text-slate-100"
        >
          <Link href="/admin/users">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Users
          </Link>
        </Button>
        <ImpersonateButton
          userId={id}
          userEmail={profile.email}
          userName={profile.full_name}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* User Details - 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          <UserDetailCard
            user={profile}
            stats={stats}
            organization={orgResult.data}
          />

          {/* Recent Projects */}
          {projectsResult.data && projectsResult.data.length > 0 && (
            <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
              <h3 className="text-sm font-medium text-slate-400 mb-3">Recent Projects</h3>
              <div className="space-y-2">
                {projectsResult.data.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-100">{project.name}</p>
                      <p className="text-xs text-slate-500">{project.trade_type}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded ${
                        project.status === 'complete'
                          ? 'bg-emerald-900/30 text-emerald-400'
                          : project.status === 'error'
                          ? 'bg-red-900/30 text-red-400'
                          : 'bg-slate-700 text-slate-300'
                      }`}>
                        {project.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - Edit & History */}
        <div className="space-y-6">
          <UserEditForm
            userId={id}
            currentPlan={profile.plan}
            currentStatus={profile.subscription_status}
            currentCredits={profile.credit_balance || 0}
            currentPromoCode={profile.promo_code}
          />

          <CreditHistory transactions={transactionsResult.data || []} />
        </div>
      </div>
    </div>
  )
}
