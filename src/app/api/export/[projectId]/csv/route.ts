import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params
    const supabase = await createClient()

    // Verify user owns this project
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch project with all data including extracted items
    const { data: project, error } = await supabase
      .from("projects")
      .select(
        `
        *,
        bid_documents (
          *,
          extracted_items (*)
        ),
        comparison_results (*)
      `
      )
      .eq("id", projectId)
      .eq("user_id", user.id)
      .single()

    if (error || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    if (project.status !== "complete" || !project.comparison_results) {
      return NextResponse.json(
        { error: "Comparison not ready for export" },
        { status: 400 }
      )
    }

    const results = project.comparison_results
    const summary = results.summary_json
    const recommendation = results.recommendation_json
    const documents = project.bid_documents

    // Build CSV content
    const lines: string[] = []

    // Header info
    lines.push(`"BidVet Comparison Report"`)
    lines.push(`"Project:","${escapeCSV(project.name)}"`)
    lines.push(`"Trade:","${escapeCSV(project.trade_type)}"`)
    if (project.location) {
      lines.push(`"Location:","${escapeCSV(project.location)}"`)
    }
    lines.push(`"Generated:","${new Date().toISOString()}"`)
    lines.push(``)

    // Summary section
    lines.push(`"SUMMARY"`)
    lines.push(`"Total Bids:","${results.total_bids}"`)
    lines.push(`"Price Low:","${results.price_low || 'N/A'}"`)
    lines.push(`"Price High:","${results.price_high || 'N/A'}"`)
    lines.push(`"Price Average:","${results.price_average ? Math.round(results.price_average) : 'N/A'}"`)
    lines.push(`"Total Scope Items:","${results.total_scope_items}"`)
    lines.push(`"Common Items:","${results.common_items}"`)
    lines.push(`"Scope Gaps:","${results.gap_items}"`)
    lines.push(``)

    // Recommendation
    lines.push(`"RECOMMENDATION"`)
    lines.push(`"Recommended Contractor:","${escapeCSV(recommendation.recommended_contractor_name)}"`)
    lines.push(`"Confidence:","${recommendation.confidence}"`)
    lines.push(`"Reasoning:","${escapeCSV(recommendation.reasoning)}"`)
    lines.push(``)

    // Contractor comparison table
    lines.push(`"CONTRACTOR COMPARISON"`)
    lines.push(`"Contractor","Base Bid","Total Bid","Item Count","Exclusion Count","Exclusions Value","Avg Confidence"`)
    for (const contractor of summary.contractors) {
      lines.push(`"${escapeCSV(contractor.name)}","${contractor.base_bid}","${contractor.total_bid}","${contractor.item_count}","${contractor.exclusion_count}","${contractor.exclusions_value || 0}","${(contractor.confidence_avg * 100).toFixed(1)}%"`)
    }
    lines.push(``)

    // Scope gaps
    if (summary.scope_gaps && summary.scope_gaps.length > 0) {
      lines.push(`"SCOPE GAPS"`)
      lines.push(`"Description","Present In","Missing From","Estimated Value"`)
      for (const gap of summary.scope_gaps) {
        const presentIn = gap.present_in
          .map((id: string) => documents.find((d: any) => d.id === id)?.contractor_name || "Unknown")
          .join("; ")
        const missingFrom = gap.missing_from
          .map((id: string) => documents.find((d: any) => d.id === id)?.contractor_name || "Unknown")
          .join("; ")
        lines.push(`"${escapeCSV(gap.description)}","${escapeCSV(presentIn)}","${escapeCSV(missingFrom)}","${gap.estimated_value || 'N/A'}"`)
      }
      lines.push(``)
    }

    // Detailed line items by contractor
    lines.push(`"DETAILED LINE ITEMS BY CONTRACTOR"`)
    for (const doc of documents) {
      lines.push(``)
      lines.push(`"${escapeCSV(doc.contractor_name)}"`)
      lines.push(`"Description","Category","Quantity","Unit","Unit Price","Total Price","Type","Confidence"`)

      const items = doc.extracted_items || []
      for (const item of items) {
        const itemType = item.is_exclusion ? "EXCLUSION" : item.is_inclusion ? "INCLUSION" : "BASE"
        lines.push(`"${escapeCSV(item.description)}","${escapeCSV(item.category || '')}","${item.quantity || ''}","${item.unit || ''}","${item.unit_price || ''}","${item.total_price || ''}","${itemType}","${((item.confidence_score || 0) * 100).toFixed(0)}%"`)
      }
    }

    lines.push(``)
    lines.push(`"Powered by Foxtrove.ai"`)

    const csvContent = lines.join("\n")
    const filename = `${project.name.replace(/[^a-zA-Z0-9]/g, "_")}_comparison.csv`

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error("CSV export error:", error)
    return NextResponse.json(
      { error: "Failed to generate CSV" },
      { status: 500 }
    )
  }
}

function escapeCSV(str: string | null | undefined): string {
  if (!str) return ""
  // Replace double quotes with two double quotes
  return str.replace(/"/g, '""')
}
