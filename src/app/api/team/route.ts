import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET /api/team - Get current user's organization
export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's organization membership
    const { data: membership, error: memberError } = await supabase
      .from("organization_members")
      .select(`
        role,
        organization:organizations (
          id,
          name,
          slug,
          owner_id,
          logo_url,
          plan,
          max_members,
          created_at
        )
      `)
      .eq("user_id", user.id)
      .single()

    if (memberError && memberError.code !== 'PGRST116') {
      console.error("Error fetching organization:", memberError)
      return NextResponse.json({ error: "Failed to fetch organization" }, { status: 500 })
    }

    if (!membership) {
      return NextResponse.json({ organization: null })
    }

    // Get member count
    const { count } = await supabase
      .from("organization_members")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", (membership.organization as any).id)

    return NextResponse.json({
      organization: membership.organization,
      role: membership.role,
      memberCount: count || 0,
    })
  } catch (error) {
    console.error("Team fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/team - Create a new organization (for team plan subscribers)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name } = body

    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json(
        { error: "Organization name must be at least 2 characters" },
        { status: 400 }
      )
    }

    // Check if user already has an organization
    const { data: existingMembership } = await supabase
      .from("organization_members")
      .select("id")
      .eq("user_id", user.id)
      .single()

    if (existingMembership) {
      return NextResponse.json(
        { error: "You are already part of an organization" },
        { status: 400 }
      )
    }

    // Check if user has team plan
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan, subscription_status")
      .eq("id", user.id)
      .single()

    if (!profile || (profile.plan !== "team" && profile.plan !== "enterprise") || profile.subscription_status !== "active") {
      return NextResponse.json(
        { error: "Team plan subscription required to create an organization" },
        { status: 403 }
      )
    }

    // Generate slug
    const { data: slugData } = await supabase.rpc("generate_org_slug", { org_name: name.trim() })
    const slug = slugData || name.toLowerCase().replace(/[^a-z0-9]/g, "-")

    // Create organization
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .insert({
        name: name.trim(),
        slug,
        owner_id: user.id,
        plan: profile.plan,
        max_members: profile.plan === "enterprise" ? 100 : 10,
      })
      .select()
      .single()

    if (orgError) {
      console.error("Error creating organization:", orgError)
      return NextResponse.json({ error: "Failed to create organization" }, { status: 500 })
    }

    // Add owner as member
    const { error: memberError } = await supabase.from("organization_members").insert({
      organization_id: org.id,
      user_id: user.id,
      role: "owner",
    })

    if (memberError) {
      console.error("Error adding owner as member:", memberError)
      // Rollback org creation
      await supabase.from("organizations").delete().eq("id", org.id)
      return NextResponse.json({ error: "Failed to create organization" }, { status: 500 })
    }

    // Update profile with organization_id
    await supabase
      .from("profiles")
      .update({ organization_id: org.id })
      .eq("id", user.id)

    return NextResponse.json({ organization: org })
  } catch (error) {
    console.error("Team creation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH /api/team - Update organization
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name } = body

    // Get user's organization and verify ownership
    const { data: membership } = await supabase
      .from("organization_members")
      .select("organization_id, role")
      .eq("user_id", user.id)
      .single()

    if (!membership || membership.role !== "owner") {
      return NextResponse.json(
        { error: "Only owners can update organization" },
        { status: 403 }
      )
    }

    const updates: Record<string, any> = {}
    if (name && typeof name === "string" && name.trim().length >= 2) {
      updates.name = name.trim()
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid updates provided" }, { status: 400 })
    }

    const { data: org, error: updateError } = await supabase
      .from("organizations")
      .update(updates)
      .eq("id", membership.organization_id)
      .select()
      .single()

    if (updateError) {
      console.error("Error updating organization:", updateError)
      return NextResponse.json({ error: "Failed to update organization" }, { status: 500 })
    }

    return NextResponse.json({ organization: org })
  } catch (error) {
    console.error("Team update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
