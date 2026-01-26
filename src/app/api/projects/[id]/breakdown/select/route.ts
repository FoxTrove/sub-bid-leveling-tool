import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import type { BreakdownStructure, BreakdownSource } from "@/types"

interface SelectBreakdownRequest {
  optionId?: string // Select from generated options
  structure?: BreakdownStructure // Custom structure
  source: BreakdownSource
  saveAsTemplate?: {
    name: string
    description?: string
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params
    const body: SelectBreakdownRequest = await request.json()
    const supabase = await createClient()

    // Verify user owns this project
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get project
    const { data: project } = await supabase
      .from("projects")
      .select("id, user_id, trade_type")
      .eq("id", projectId)
      .single()

    if (!project || project.user_id !== user.id) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    let breakdownStructure: BreakdownStructure
    let breakdownType: string

    if (body.optionId) {
      // Select from generated options
      const { data: option } = await supabase
        .from("breakdown_options")
        .select("breakdown_type, breakdown_structure")
        .eq("id", body.optionId)
        .eq("project_id", projectId)
        .single()

      if (!option) {
        return NextResponse.json(
          { error: "Breakdown option not found" },
          { status: 404 }
        )
      }

      breakdownStructure = option.breakdown_structure as BreakdownStructure
      breakdownType = option.breakdown_type
    } else if (body.structure) {
      // Custom structure provided
      breakdownStructure = body.structure
      breakdownType = body.structure.type || "custom"
    } else {
      return NextResponse.json(
        { error: "Either optionId or structure must be provided" },
        { status: 400 }
      )
    }

    // Update project with selected breakdown
    const { error: updateError } = await supabase
      .from("projects")
      .update({
        breakdown_type: breakdownType,
        breakdown_structure: breakdownStructure,
        breakdown_source: body.source,
      })
      .eq("id", projectId)

    if (updateError) {
      console.error("Failed to update project breakdown:", updateError)
      return NextResponse.json(
        { error: "Failed to save breakdown selection" },
        { status: 500 }
      )
    }

    // Optionally save as template
    if (body.saveAsTemplate && body.saveAsTemplate.name) {
      const { error: templateError } = await supabase
        .from("breakdown_templates")
        .insert({
          user_id: user.id,
          trade_type: project.trade_type,
          name: body.saveAsTemplate.name,
          description: body.saveAsTemplate.description || null,
          breakdown_structure: breakdownStructure,
          use_count: 1,
        })

      if (templateError) {
        console.error("Failed to save breakdown template:", templateError)
        // Don't fail the request, template save is optional
      }
    }

    // If selecting from a template, increment use count
    if (body.source === "template" && body.optionId) {
      // Check if this is actually a template (optionId might be a template ID)
      await supabase
        .from("breakdown_templates")
        .update({ use_count: supabase.rpc("increment", { x: 1 }) })
        .eq("id", body.optionId)
        .eq("user_id", user.id)
    }

    return NextResponse.json({
      success: true,
      breakdown: {
        type: breakdownType,
        structure: breakdownStructure,
        source: body.source,
      },
    })
  } catch (error) {
    console.error("Select breakdown error:", error)
    return NextResponse.json(
      { error: "Failed to select breakdown" },
      { status: 500 }
    )
  }
}

// Get current breakdown selection
export async function GET(
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

    const { data: project } = await supabase
      .from("projects")
      .select("user_id, breakdown_type, breakdown_structure, breakdown_source")
      .eq("id", projectId)
      .single()

    if (!project || project.user_id !== user.id) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    return NextResponse.json({
      type: project.breakdown_type,
      structure: project.breakdown_structure,
      source: project.breakdown_source,
      hasSelection: !!project.breakdown_type,
    })
  } catch (error) {
    console.error("Get breakdown error:", error)
    return NextResponse.json(
      { error: "Failed to get breakdown" },
      { status: 500 }
    )
  }
}
