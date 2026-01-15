import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { renderToBuffer } from "@react-pdf/renderer"
import { ComparisonReportPDF } from "@/lib/pdf/generator"
import React, { type ReactElement } from "react"
import type { DocumentProps } from "@react-pdf/renderer"

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

    // Fetch project with all data
    const { data: project, error } = await supabase
      .from("projects")
      .select(
        `
        *,
        bid_documents (*),
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

    // Generate PDF
    const pdfBuffer = await renderToBuffer(
      React.createElement(ComparisonReportPDF, {
        project,
        documents: project.bid_documents,
        results: project.comparison_results,
      }) as ReactElement<DocumentProps>
    )

    // Return PDF
    const filename = `${project.name.replace(/[^a-zA-Z0-9]/g, "_")}_comparison.pdf`

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error("PDF export error:", error)
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    )
  }
}
