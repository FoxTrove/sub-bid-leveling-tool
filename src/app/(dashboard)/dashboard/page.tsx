import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { TrialBanner } from "@/components/dashboard/trial-banner"
import { EmptyState } from "@/components/dashboard/empty-state"
import { ProjectCard } from "@/components/dashboard/project-card"

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

  // Fetch projects with bid counts and comparison results
  const { data: projects } = await supabase
    .from("projects")
    .select(
      `
      *,
      bid_documents (id),
      comparison_results (
        price_low,
        price_high,
        recommendation_json
      )
    `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  const hasProjects = projects && projects.length > 0

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Your Comparisons</h1>
        <p className="mt-2 text-muted-foreground">
          View and manage your bid comparisons
        </p>
      </div>

      {profile && (
        <TrialBanner
          trialStartedAt={profile.trial_started_at}
          hasOwnApiKey={!!profile.openai_api_key_encrypted}
        />
      )}

      {!hasProjects ? (
        <EmptyState />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  )
}
