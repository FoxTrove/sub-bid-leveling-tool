import { createClient, createAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { decrypt } from "@/lib/utils/encryption"
import { getUsageStatus } from "@/lib/utils/subscription"
import { rateLimiters } from "@/lib/utils/rate-limit"
import type { Profile } from "@/types"

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

    // Rate limiting - 5 analyses per minute per user
    const rateLimit = rateLimiters.analyze(user.id)
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too many requests. Please wait before starting another analysis." },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)),
            'X-RateLimit-Remaining': '0',
          }
        }
      )
    }

    const { data: project } = await supabase
      .from("projects")
      .select("user_id, trade_type, bid_documents(id)")
      .eq("id", projectId)
      .single()

    if (!project || project.user_id !== user.id) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Get user's profile for API key and usage check
    const adminSupabase = createAdminClient()
    const { data: profile } = await adminSupabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    // Check usage limits
    const usageStatus = getUsageStatus(profile as Profile)

    if (!usageStatus.canCreateComparison) {
      return NextResponse.json(
        { error: usageStatus.reason || "You've reached your comparison limit. Upgrade to continue." },
        { status: 403 }
      )
    }

    // Determine which API key to use
    let openaiApiKey: string

    if (profile.openai_api_key_encrypted) {
      openaiApiKey = decrypt(profile.openai_api_key_encrypted)
    } else {
      // Use app's API key for paid plans or free tier
      openaiApiKey = process.env.OPENAI_API_KEY || ""
      if (!openaiApiKey) {
        return NextResponse.json(
          { error: "OpenAI API key not configured" },
          { status: 500 }
        )
      }
    }

    // Deduct credit if using credit-based access
    if (usageStatus.accessType === "credits") {
      const { data: deductResult, error: deductError } = await adminSupabase.rpc("deduct_credits", {
        p_user_id: user.id,
        p_amount: 1,
        p_project_id: projectId,
        p_description: `Bid comparison for ${project.trade_type || "project"}`,
      })

      if (deductError || (deductResult && !deductResult.success)) {
        console.error("Credit deduction failed:", deductError || deductResult)
        return NextResponse.json(
          { error: "Failed to deduct credits. Please try again." },
          { status: 500 }
        )
      }
    }

    // Increment comparisons_used for tracking purposes
    await adminSupabase
      .from("profiles")
      .update({ comparisons_used: (profile.comparisons_used || 0) + 1 })
      .eq("id", user.id)

    // Clear any existing extracted items for re-analysis
    const documentIds = project.bid_documents?.map((d: { id: string }) => d.id) || []
    if (documentIds.length > 0) {
      await adminSupabase
        .from("extracted_items")
        .delete()
        .in("bid_document_id", documentIds)
    }

    // Update project status to processing
    await adminSupabase
      .from("projects")
      .update({ status: "processing", error_message: null })
      .eq("id", projectId)

    // Reset document statuses
    await adminSupabase
      .from("bid_documents")
      .update({ upload_status: "uploaded", error_message: null })
      .eq("project_id", projectId)

    // Fire off the orchestrator Edge Function (don't await - let it run)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

    fetch(`${supabaseUrl}/functions/v1/orchestrate-analysis`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId,
        openaiApiKey,
        tradeType: project.trade_type,
        documentIds,
      }),
    }).catch((error) => {
      console.error("Orchestrator call failed:", error)
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
