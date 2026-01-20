import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET /api/team/members - Get organization members
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

    // Get user's organization
    const { data: membership } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.id)
      .single()

    if (!membership) {
      return NextResponse.json({ error: "Not part of an organization" }, { status: 404 })
    }

    // Get all members with profile info
    const { data: members, error: membersError } = await supabase
      .from("organization_members")
      .select(`
        id,
        role,
        joined_at,
        user_id,
        profiles:user_id (
          id,
          email,
          full_name,
          company_name
        )
      `)
      .eq("organization_id", membership.organization_id)
      .order("joined_at", { ascending: true })

    if (membersError) {
      console.error("Error fetching members:", membersError)
      return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 })
    }

    // Get pending invites
    const { data: invites, error: invitesError } = await supabase
      .from("organization_invites")
      .select("*")
      .eq("organization_id", membership.organization_id)
      .eq("status", "pending")
      .order("created_at", { ascending: false })

    if (invitesError) {
      console.error("Error fetching invites:", invitesError)
    }

    return NextResponse.json({
      members: members || [],
      invites: invites || [],
    })
  } catch (error) {
    console.error("Team members fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/team/members - Remove a member from the organization
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const memberId = searchParams.get("memberId")

    if (!memberId) {
      return NextResponse.json({ error: "Member ID required" }, { status: 400 })
    }

    // Get user's organization and verify admin/owner role
    const { data: myMembership } = await supabase
      .from("organization_members")
      .select("organization_id, role")
      .eq("user_id", user.id)
      .single()

    if (!myMembership || !["owner", "admin"].includes(myMembership.role)) {
      return NextResponse.json(
        { error: "Only admins can remove members" },
        { status: 403 }
      )
    }

    // Get the member to remove
    const { data: memberToRemove } = await supabase
      .from("organization_members")
      .select("id, user_id, role")
      .eq("id", memberId)
      .eq("organization_id", myMembership.organization_id)
      .single()

    if (!memberToRemove) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 })
    }

    // Cannot remove the owner
    if (memberToRemove.role === "owner") {
      return NextResponse.json(
        { error: "Cannot remove the organization owner" },
        { status: 403 }
      )
    }

    // Cannot remove self (use leave endpoint instead)
    if (memberToRemove.user_id === user.id) {
      return NextResponse.json(
        { error: "Cannot remove yourself. Use leave instead." },
        { status: 400 }
      )
    }

    // Remove the member
    const { error: deleteError } = await supabase
      .from("organization_members")
      .delete()
      .eq("id", memberId)

    if (deleteError) {
      console.error("Error removing member:", deleteError)
      return NextResponse.json({ error: "Failed to remove member" }, { status: 500 })
    }

    // Update the removed user's profile
    await supabase
      .from("profiles")
      .update({ organization_id: null })
      .eq("id", memberToRemove.user_id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Member removal error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH /api/team/members - Update a member's role
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
    const { memberId, role } = body

    if (!memberId || !role) {
      return NextResponse.json({ error: "Member ID and role required" }, { status: 400 })
    }

    if (!["admin", "member"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    // Get user's organization and verify owner role (only owners can change roles)
    const { data: myMembership } = await supabase
      .from("organization_members")
      .select("organization_id, role")
      .eq("user_id", user.id)
      .single()

    if (!myMembership || myMembership.role !== "owner") {
      return NextResponse.json(
        { error: "Only owners can change member roles" },
        { status: 403 }
      )
    }

    // Get the member to update
    const { data: memberToUpdate } = await supabase
      .from("organization_members")
      .select("id, role")
      .eq("id", memberId)
      .eq("organization_id", myMembership.organization_id)
      .single()

    if (!memberToUpdate) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 })
    }

    // Cannot change owner's role
    if (memberToUpdate.role === "owner") {
      return NextResponse.json(
        { error: "Cannot change owner's role" },
        { status: 403 }
      )
    }

    // Update the role
    const { error: updateError } = await supabase
      .from("organization_members")
      .update({ role })
      .eq("id", memberId)

    if (updateError) {
      console.error("Error updating member role:", updateError)
      return NextResponse.json({ error: "Failed to update member role" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Member role update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
