import { createClient, createAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { decrypt } from "@/lib/utils/encryption"
import { createOpenAIClient, chatCompletion } from "@/lib/ai/openai"
import {
  getBreakdownGenerationPrompt,
  parseBreakdownResponse,
  getDefaultBreakdownOptions,
} from "@/lib/ai/prompts/breakdown-generation"
import type { Profile, BidDocument } from "@/types"

const MAX_SAMPLE_LENGTH = 2000 // Characters per document sample

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

    // Get project with documents
    const { data: project } = await supabase
      .from("projects")
      .select(`
        id,
        user_id,
        trade_type,
        bid_documents (
          id,
          contractor_name,
          raw_text,
          upload_status
        )
      `)
      .eq("id", projectId)
      .single()

    if (!project || project.user_id !== user.id) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const documents = project.bid_documents as BidDocument[]

    // Check if we have documents with extracted text
    const docsWithText = documents.filter(
      (d) => d.upload_status === "processed" && d.raw_text
    )

    if (docsWithText.length === 0) {
      return NextResponse.json(
        { error: "No processed documents available. Please upload and process bid documents first." },
        { status: 400 }
      )
    }

    // Get user's profile for API key
    const adminSupabase = createAdminClient()
    const { data: profile } = await adminSupabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    // Determine OpenAI API key
    let apiKey = process.env.OPENAI_API_KEY
    const typedProfile = profile as Profile

    if (typedProfile.openai_api_key_encrypted) {
      try {
        apiKey = decrypt(typedProfile.openai_api_key_encrypted)
      } catch {
        // Fall back to app key
      }
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: "No OpenAI API key configured" },
        { status: 400 }
      )
    }

    // Check for existing breakdown options (cached)
    const { data: existingOptions } = await supabase
      .from("breakdown_options")
      .select("*")
      .eq("project_id", projectId)
      .order("option_index", { ascending: true })

    if (existingOptions && existingOptions.length > 0) {
      // Return cached options
      return NextResponse.json({
        options: existingOptions.map((opt) => ({
          id: opt.id,
          type: opt.breakdown_type,
          structure: opt.breakdown_structure,
          confidence: opt.confidence_score,
          explanation: opt.explanation,
          isRecommended: opt.is_recommended,
        })),
        cached: true,
      })
    }

    // Prepare document samples for AI analysis
    const documentSamples = docsWithText.map((doc) => ({
      contractorName: doc.contractor_name,
      textSample: (doc.raw_text || "").slice(0, MAX_SAMPLE_LENGTH),
    }))

    // Generate breakdown options using AI
    const openai = createOpenAIClient(apiKey)
    const prompt = getBreakdownGenerationPrompt(
      project.trade_type,
      documentSamples
    )

    let result
    try {
      const response = await chatCompletion(openai, [
        { role: "user", content: prompt },
      ])
      result = parseBreakdownResponse(response)
    } catch (aiError) {
      console.error("AI breakdown generation failed:", aiError)
      // Fall back to default options
      result = getDefaultBreakdownOptions(project.trade_type)
    }

    // Cache the generated options
    const optionsToInsert = result.options.map((opt, index) => ({
      project_id: projectId,
      option_index: index,
      breakdown_type: opt.type,
      breakdown_structure: opt.structure,
      confidence_score: opt.confidence,
      explanation: opt.explanation,
      is_recommended: opt.isRecommended,
    }))

    const { data: insertedOptions, error: insertError } = await supabase
      .from("breakdown_options")
      .insert(optionsToInsert)
      .select()

    if (insertError) {
      console.error("Failed to cache breakdown options:", insertError)
    }

    return NextResponse.json({
      options: (insertedOptions || optionsToInsert).map((opt) => ({
        id: opt.id || `temp-${opt.option_index}`,
        type: opt.breakdown_type,
        structure: opt.breakdown_structure,
        confidence: opt.confidence_score,
        explanation: opt.explanation,
        isRecommended: opt.is_recommended,
      })),
      analysis_notes: result.analysis_notes,
      cached: false,
    })
  } catch (error) {
    console.error("Breakdown generation error:", error)
    return NextResponse.json(
      { error: "Failed to generate breakdown options" },
      { status: 500 }
    )
  }
}

// Allow regenerating options (delete cache and generate fresh)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify ownership
    const { data: project } = await supabase
      .from("projects")
      .select("user_id")
      .eq("id", projectId)
      .single()

    if (!project || project.user_id !== user.id) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Delete cached options
    await supabase
      .from("breakdown_options")
      .delete()
      .eq("project_id", projectId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete breakdown options error:", error)
    return NextResponse.json(
      { error: "Failed to delete breakdown options" },
      { status: 500 }
    )
  }
}
