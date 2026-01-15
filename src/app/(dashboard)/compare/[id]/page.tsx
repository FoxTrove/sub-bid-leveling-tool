import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Download, Loader2, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SummaryCards } from "@/components/compare/results/summary-cards"
import { ComparisonGrid } from "@/components/compare/results/comparison-grid"
import { RecommendationPanel } from "@/components/compare/results/recommendation-panel"
import { ProcessingState } from "@/components/compare/results/processing-state"
import { ContractorDetailCards } from "@/components/compare/results/contractor-detail-cards"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default async function ComparisonPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: projectId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Fetch project with all related data
  const { data: project, error } = await supabase
    .from("projects")
    .select(
      `
      *,
      bid_documents (
        id,
        contractor_name,
        file_name,
        upload_status,
        extracted_items (*)
      ),
      comparison_results (*)
    `
    )
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single()

  if (error || !project) {
    notFound()
  }

  const isProcessing = project.status === "processing" || project.status === "uploading"
  const hasError = project.status === "error"
  const isComplete = project.status === "complete"

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <Link
            href="/dashboard"
            className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold">{project.name}</h1>
          <div className="mt-2 flex items-center gap-3">
            <Badge variant="outline">{project.trade_type}</Badge>
            {project.location && (
              <span className="text-sm text-muted-foreground">
                {project.location}
              </span>
            )}
          </div>
        </div>

        {isComplete && (
          <div className="flex gap-2">
            <Link href={`/api/export/${projectId}`} target="_blank">
              <Button>
                <Download className="mr-2 h-4 w-4" />
                Export PDF
              </Button>
            </Link>
            <Link href={`/api/export/${projectId}/csv`} target="_blank">
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Processing State */}
      {isProcessing && (
        <ProcessingState
          projectId={projectId}
          documents={project.bid_documents}
        />
      )}

      {/* Error State */}
      {hasError && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {project.error_message ||
              "An error occurred during analysis. Please try again."}
          </AlertDescription>
        </Alert>
      )}

      {/* Results */}
      {isComplete && project.comparison_results && (
        <div className="space-y-8">
          <SummaryCards
            results={project.comparison_results}
            documents={project.bid_documents}
          />

          <RecommendationPanel
            recommendation={project.comparison_results.recommendation_json}
            documents={project.bid_documents}
          />

          <ComparisonGrid
            documents={project.bid_documents}
            results={project.comparison_results}
          />

          <ContractorDetailCards
            documents={project.bid_documents}
            results={project.comparison_results}
          />
        </div>
      )}
    </div>
  )
}
