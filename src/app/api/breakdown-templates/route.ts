import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import type { BreakdownStructure } from "@/types"

interface CreateTemplateRequest {
  trade_type: string
  name: string
  description?: string
  breakdown_structure: BreakdownStructure
}

// GET - List user's breakdown templates
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const tradeType = searchParams.get("trade_type")

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let query = supabase
      .from("breakdown_templates")
      .select("*")
      .eq("user_id", user.id)
      .order("use_count", { ascending: false })
      .order("created_at", { ascending: false })

    if (tradeType) {
      query = query.eq("trade_type", tradeType)
    }

    const { data: templates, error } = await query

    if (error) {
      console.error("Failed to fetch templates:", error)
      return NextResponse.json(
        { error: "Failed to fetch templates" },
        { status: 500 }
      )
    }

    return NextResponse.json({ templates })
  } catch (error) {
    console.error("Get templates error:", error)
    return NextResponse.json(
      { error: "Failed to get templates" },
      { status: 500 }
    )
  }
}

// POST - Create a new breakdown template
export async function POST(request: Request) {
  try {
    const body: CreateTemplateRequest = await request.json()
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Validate required fields
    if (!body.trade_type || !body.name || !body.breakdown_structure) {
      return NextResponse.json(
        { error: "Missing required fields: trade_type, name, breakdown_structure" },
        { status: 400 }
      )
    }

    // Validate structure
    if (!body.breakdown_structure.nodes || !Array.isArray(body.breakdown_structure.nodes)) {
      return NextResponse.json(
        { error: "Invalid breakdown structure: nodes array required" },
        { status: 400 }
      )
    }

    // Check for duplicate name
    const { data: existing } = await supabase
      .from("breakdown_templates")
      .select("id")
      .eq("user_id", user.id)
      .eq("trade_type", body.trade_type)
      .eq("name", body.name)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: "A template with this name already exists for this trade type" },
        { status: 409 }
      )
    }

    const { data: template, error } = await supabase
      .from("breakdown_templates")
      .insert({
        user_id: user.id,
        trade_type: body.trade_type,
        name: body.name,
        description: body.description || null,
        breakdown_structure: body.breakdown_structure,
        use_count: 0,
      })
      .select()
      .single()

    if (error) {
      console.error("Failed to create template:", error)
      return NextResponse.json(
        { error: "Failed to create template" },
        { status: 500 }
      )
    }

    return NextResponse.json({ template }, { status: 201 })
  } catch (error) {
    console.error("Create template error:", error)
    return NextResponse.json(
      { error: "Failed to create template" },
      { status: 500 }
    )
  }
}

// DELETE - Delete a template (by ID in query param)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const templateId = searchParams.get("id")

    if (!templateId) {
      return NextResponse.json(
        { error: "Template ID required" },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { error } = await supabase
      .from("breakdown_templates")
      .delete()
      .eq("id", templateId)
      .eq("user_id", user.id)

    if (error) {
      console.error("Failed to delete template:", error)
      return NextResponse.json(
        { error: "Failed to delete template" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete template error:", error)
    return NextResponse.json(
      { error: "Failed to delete template" },
      { status: 500 }
    )
  }
}
