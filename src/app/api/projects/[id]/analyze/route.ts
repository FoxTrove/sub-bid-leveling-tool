import { createClient, createAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { decrypt } from "@/lib/utils/encryption"
import { isTrialExpired } from "@/lib/utils/format"

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

    // Get user's API key or check trial
    const adminSupabase = createAdminClient()
    const { data: profile } = await adminSupabase
      .from("profiles")
      .select("openai_api_key_encrypted, trial_started_at")
      .eq("id", user.id)
      .single()

    let openaiApiKey: string

    if (profile?.openai_api_key_encrypted) {
      openaiApiKey = decrypt(profile.openai_api_key_encrypted)
    } else if (profile?.trial_started_at && !isTrialExpired(profile.trial_started_at)) {
      openaiApiKey = process.env.OPENAI_API_KEY || ""
      if (!openaiApiKey) {
        return NextResponse.json(
          { error: "OpenAI API key not configured" },
          { status: 500 }
        )
      }
    } else {
      return NextResponse.json(
        { error: "Trial expired. Please add your OpenAI API key in settings." },
        { status: 403 }
      )
    }

    // Update project status to processing
    await adminSupabase
      .from("projects")
      .update({ status: "processing" })
      .eq("id", projectId)

    // Call Supabase Edge Function for analysis (has longer timeout)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    // Get the user's session token to authenticate with Edge Function
    const { data: sessionData } = await supabase.auth.getSession()
    const accessToken = sessionData?.session?.access_token

    if (!accessToken) {
      return NextResponse.json({ error: "No valid session" }, { status: 401 })
    }

    // Fire off the Edge Function (don't await - let it run in background)
    fetch(`${supabaseUrl}/functions/v1/analyze-bids`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
        "apikey": supabaseAnonKey || "",
      },
      body: JSON.stringify({
        projectId,
        openaiApiKey,
      }),
    }).catch((error) => {
      console.error("Edge function call failed:", error)
    })

    return NextResponse.json({ success: true, message: "Analysis started" })
  } catch (error) {
    console.error("Analysis trigger error:", error)

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
      { error: error instanceof Error ? error.message : "Failed to start analysis" },
      { status: 500 }
    )
  }
}
