import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// POST /api/team/invite/accept - Accept an invitation
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
    const { token } = body

    if (!token) {
      return NextResponse.json({ error: "Invite token is required" }, { status: 400 })
    }

    // Find the invite
    const { data: invite, error: inviteError } = await supabase
      .from("organization_invites")
      .select(`
        *,
        organization:organizations (
          id,
          name,
          max_members
        )
      `)
      .eq("token", token)
      .eq("status", "pending")
      .single()

    if (inviteError || !invite) {
      return NextResponse.json(
        { error: "Invalid or expired invite" },
        { status: 400 }
      )
    }

    // Check if invite is expired
    if (new Date(invite.expires_at) < new Date()) {
      // Mark as expired
      await supabase
        .from("organization_invites")
        .update({ status: "expired" })
        .eq("id", invite.id)

      return NextResponse.json(
        { error: "This invite has expired" },
        { status: 400 }
      )
    }

    // Check if the invite is for this user's email
    const userEmail = user.email?.toLowerCase()
    if (invite.email.toLowerCase() !== userEmail) {
      return NextResponse.json(
        { error: "This invite was sent to a different email address" },
        { status: 403 }
      )
    }

    // Check if user is already in an organization
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

    const org = invite.organization as any

    // Check if organization is at max capacity
    const { count: memberCount } = await supabase
      .from("organization_members")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", invite.organization_id)

    if ((memberCount || 0) >= org.max_members) {
      return NextResponse.json(
        { error: "Organization is at maximum capacity" },
        { status: 400 }
      )
    }

    // Add user as a member
    const { error: memberError } = await supabase
      .from("organization_members")
      .insert({
        organization_id: invite.organization_id,
        user_id: user.id,
        role: invite.role,
        invited_by: invite.invited_by,
      })

    if (memberError) {
      console.error("Error adding member:", memberError)
      return NextResponse.json({ error: "Failed to join organization" }, { status: 500 })
    }

    // Update user's profile with organization_id
    await supabase
      .from("profiles")
      .update({ organization_id: invite.organization_id })
      .eq("id", user.id)

    // Mark invite as accepted
    await supabase
      .from("organization_invites")
      .update({
        status: "accepted",
        accepted_at: new Date().toISOString(),
      })
      .eq("id", invite.id)

    return NextResponse.json({
      success: true,
      organization: {
        id: org.id,
        name: org.name,
      },
    })
  } catch (error) {
    console.error("Accept invite error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// GET /api/team/invite/accept?token=xxx - Get invite details (for preview)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get("token")

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Find the invite (don't require auth for preview)
    const { data: invite, error: inviteError } = await supabase
      .from("organization_invites")
      .select(`
        id,
        email,
        role,
        status,
        expires_at,
        organization:organizations (
          id,
          name
        )
      `)
      .eq("token", token)
      .single()

    if (inviteError || !invite) {
      return NextResponse.json(
        { error: "Invite not found" },
        { status: 404 }
      )
    }

    // Check status
    if (invite.status === "accepted") {
      return NextResponse.json(
        { error: "This invite has already been accepted" },
        { status: 400 }
      )
    }

    if (invite.status === "revoked") {
      return NextResponse.json(
        { error: "This invite has been revoked" },
        { status: 400 }
      )
    }

    if (new Date(invite.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "This invite has expired" },
        { status: 400 }
      )
    }

    return NextResponse.json({
      invite: {
        email: invite.email,
        role: invite.role,
        organization: invite.organization,
        expiresAt: invite.expires_at,
      },
    })
  } catch (error) {
    console.error("Get invite error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
