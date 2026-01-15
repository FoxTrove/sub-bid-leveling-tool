import { createClient, createAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { analyzeProject } from "@/lib/ai/analyzer"

// Increase function timeout for analysis (Vercel Pro: up to 300s)
export const maxDuration = 120

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params
    const supabase = await createClient()

    // Verify user owns this project
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: project } = await supabase
      .from("projects")
      .select("user_id")
      .eq("id", projectId)
      .single()

    if (!project || project.user_id !== user.id) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Use admin client for analysis (bypasses RLS for service operations)
    const adminSupabase = createAdminClient()

    // Update project status to processing
    await adminSupabase
      .from("projects")
      .update({ status: "processing" })
      .eq("id", projectId)

    // Run analysis synchronously - must complete within maxDuration
    await analyzeProject(adminSupabase, projectId)

    return NextResponse.json({ success: true, message: "Analysis complete" })
  } catch (error) {
    console.error("Analysis error:", error)

    // Try to update project status to error
    try {
      const adminSupabase = createAdminClient()
      const { id: projectId } = await params
      await adminSupabase
        .from("projects")
        .update({
          status: "error",
          error_message: error instanceof Error ? error.message : "Analysis failed"
        })
        .eq("id", projectId)
    } catch {
      // Ignore error updating status
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to analyze" },
      { status: 500 }
    )
  }
}
