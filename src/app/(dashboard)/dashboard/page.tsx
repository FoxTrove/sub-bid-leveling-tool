import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Plus, FolderPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { UsageBanner } from "@/components/dashboard/usage-banner"
import { EmptyState } from "@/components/dashboard/empty-state"
import { FolderCard } from "@/components/dashboard/folder-card"
import { CreateFolderDialog } from "@/components/dashboard/create-folder-dialog"
import type { FolderWithProjects } from "@/types"

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Fetch user profile for trial info
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  // Fetch folders with nested projects (including project_size)
  // Limit to most recent 50 folders for performance
  const { data: folders } = await supabase
    .from("project_folders")
    .select(
      `
      id,
      user_id,
      name,
      location,
      client_name,
      project_size,
      notes,
      created_at,
      updated_at,
      projects (
        *,
        bid_documents (id),
        comparison_results (
          price_low,
          price_high,
          recommendation_json
        )
      )
    `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50)

  const typedFolders = (folders || []) as FolderWithProjects[]
  const hasFolders = typedFolders.length > 0
  const totalProjects = typedFolders.reduce((sum, f) => sum + f.projects.length, 0)

  return (
    <div>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Your Projects</h1>
          <p className="mt-2 text-muted-foreground">
            Organize bid comparisons by project folder
          </p>
        </div>
        <div className="flex gap-2">
          <CreateFolderDialog />
          <Link href="/compare/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Comparison
            </Button>
          </Link>
        </div>
      </div>

      {profile && (
        <UsageBanner
          comparisonsUsed={profile.comparisons_used ?? 0}
          creditBalance={profile.credit_balance ?? 0}
          hasApiKey={!!profile.openai_api_key_encrypted}
          isSubscriptionActive={profile.subscription_status === 'active'}
          promoCode={profile.promo_code}
          promoAppliedAt={profile.promo_applied_at}
        />
      )}

      {!hasFolders ? (
        <EmptyState />
      ) : (
        <div className="space-y-4">
          {typedFolders.map((folder, index) => (
            <FolderCard
              key={folder.id}
              folder={folder}
              defaultOpen={index === 0 || folder.projects.some(p => p.status === "processing")}
            />
          ))}
        </div>
      )}

      {hasFolders && totalProjects === 0 && (
        <div className="mt-8 rounded-lg border border-dashed p-8 text-center">
          <h3 className="font-semibold">Ready to compare bids?</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Create your first bid comparison to get started with AI-powered analysis.
          </p>
          <Link href="/compare/new">
            <Button className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              New Comparison
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}
