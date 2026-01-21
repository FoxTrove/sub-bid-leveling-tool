import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Download, AlertTriangle, RefreshCw, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SummaryCards } from "@/components/compare/results/summary-cards"
import { ComparisonGrid } from "@/components/compare/results/comparison-grid"
import { RecommendationPanel } from "@/components/compare/results/recommendation-panel"
import { ProcessingState } from "@/components/compare/results/processing-state"
import { ContractorDetailCards } from "@/components/compare/results/contractor-detail-cards"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ReanalyzeButton } from "@/components/compare/results/reanalyze-button"
import { ResultsTracker, TrackedExportLink } from "@/components/compare/results/results-tracker"
import { FirstComparisonModal } from "@/components/compare/results/first-comparison-modal"
import { FREE_COMPARISON_LIMIT } from "@/lib/utils/constants"

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

  // Fetch user profile for upsell modal
  const { data: profile } = await supabase
    .from("profiles")
    .select("comparisons_used, credit_balance, openai_api_key_encrypted, subscription_status, promo_code")
    .eq("id", user.id)
    .single()

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
        error_message,
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

  // Check for partial failures (completed but some docs failed)
  const failedDocs = project.bid_documents.filter(
    (d: any) => d.upload_status === "error"
  )
  const hasPartialFailure = isComplete && failedDocs.length > 0

  // Check if any contractor has $0 (extraction issue)
  const hasZeroBids = isComplete && project.comparison_results?.summary_json?.contractors?.some(
    (c: any) => c.total_bid === 0 || c.item_count === 0
  )

  // Get friendly error message
  const getFriendlyErrorMessage = (errorMsg: string | null): string => {
    if (!errorMsg) return "An unexpected error occurred during analysis."

    if (errorMsg.includes("No items extracted")) {
      return "Could not extract bid items from the uploaded documents. Please ensure the files contain readable bid information in a standard format (PDF, Excel, CSV)."
    }
    if (errorMsg.includes("parse") || errorMsg.includes("JSON")) {
      return "The AI had trouble reading one or more bid documents. Try re-uploading in a different format."
    }
    if (errorMsg.includes("API") || errorMsg.includes("OpenAI")) {
      return "The AI service is temporarily unavailable. Please try again in a few minutes."
    }
    if (errorMsg.includes("timeout")) {
      return "Analysis took too long to complete. Try with smaller files or fewer bids."
    }

    return errorMsg
  }

  return (
    <div>
      {/* Analytics Tracker */}
      <ResultsTracker
        comparisonId={projectId}
        isComplete={isComplete}
        completedAt={project.comparison_results?.created_at}
      />

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
            {hasPartialFailure && (
              <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                Partial Results
              </Badge>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          {(hasError || hasPartialFailure || hasZeroBids) && (
            <ReanalyzeButton projectId={projectId} />
          )}
          {isComplete && (
            <>
              <TrackedExportLink
                comparisonId={projectId}
                format="pdf"
                href={`/api/export/${projectId}`}
              >
                <Button>
                  <Download className="mr-2 h-4 w-4" />
                  Export PDF
                </Button>
              </TrackedExportLink>
              <TrackedExportLink
                comparisonId={projectId}
                format="csv"
                href={`/api/export/${projectId}/csv`}
              >
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
              </TrackedExportLink>
            </>
          )}
        </div>
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
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Analysis Failed</AlertTitle>
          <AlertDescription className="mt-2">
            {getFriendlyErrorMessage(project.error_message)}
            <div className="mt-3">
              <ReanalyzeButton projectId={projectId} variant="outline" size="sm" />
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Partial Failure Warning */}
      {hasPartialFailure && (
        <Alert className="mb-6 border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800">Some Bids Could Not Be Processed</AlertTitle>
          <AlertDescription className="text-amber-700">
            <p className="mt-1">
              The following bids failed to extract: {failedDocs.map((d: any) => d.contractor_name).join(", ")}
            </p>
            <p className="mt-2 text-sm">
              Results below are based on the successfully processed bids only.
              You can re-run the analysis to retry the failed bids.
            </p>
          </AlertDescription>
        </Alert>
      )}

      {/* Zero Bids Warning */}
      {hasZeroBids && !hasPartialFailure && (
        <Alert className="mb-6 border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800">Incomplete Extraction Detected</AlertTitle>
          <AlertDescription className="text-amber-700">
            <p className="mt-1">
              Some bids show $0 totals, which may indicate extraction issues.
              Consider re-running the analysis or checking the uploaded files.
            </p>
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

      {/* First Comparison Upsell Modal */}
      {isComplete && profile && (
        <FirstComparisonModal
          comparisonsUsed={profile.comparisons_used || 0}
          hasApiKey={!!profile.openai_api_key_encrypted}
          isSubscriptionActive={profile.subscription_status === "active"}
          promoCode={profile.promo_code}
          freeRemaining={Math.max(FREE_COMPARISON_LIMIT - (profile.comparisons_used || 0), 0)}
        />
      )}
    </div>
  )
}
