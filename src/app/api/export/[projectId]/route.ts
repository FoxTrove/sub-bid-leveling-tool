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

    // Fetch project with all data including extracted items and folder
    const { data: project, error } = await supabase
      .from("projects")
      .select(
        `
        *,
        bid_documents (
          *,
          extracted_items (*)
        ),
        comparison_results (*),
        project_folders (
          name,
          client_name,
          location,
          project_size
        )
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

    // Fetch user profile for company info
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, company_name, gc_name")
      .eq("id", user.id)
      .single()

    // Generate PDF
    const pdfBuffer = await renderToBuffer(
      React.createElement(ComparisonReportPDF, {
        project,
        documents: project.bid_documents,
        results: project.comparison_results,
        profile: profile || undefined,
        folder: project.project_folders || undefined,
      }) as ReactElement<DocumentProps>
    )

    // Return PDF
    const filename = `${project.name.replace(/[^a-zA-Z0-9]/g, "_")}_comparison.pdf`

    return new NextResponse(new Uint8Array(pdfBuffer), {
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
