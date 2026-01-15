import { createClient, createAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { analyzeProject } from "@/lib/ai/analyzer"

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

    // Run analysis in background
    // Note: In production, you'd use a queue like Vercel's background functions
    analyzeProject(adminSupabase, projectId).catch((error) => {
      console.error("Background analysis error:", error)
    })

    return NextResponse.json({ success: true, message: "Analysis started" })
  } catch (error) {
    console.error("Analysis trigger error:", error)
    return NextResponse.json(
      { error: "Failed to start analysis" },
      { status: 500 }
    )
  }
}
