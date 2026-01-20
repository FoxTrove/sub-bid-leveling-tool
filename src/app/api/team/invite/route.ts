import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { nanoid } from "nanoid"
import { sendTeamInviteEmail } from "@/lib/email"

// POST /api/team/invite - Send an invite to join the organization
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
    const { email, role = "member" } = body

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()

    if (!["admin", "member"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    // Get user's organization and verify admin/owner role
    const { data: myMembership } = await supabase
      .from("organization_members")
      .select(`
        organization_id,
        role,
        organization:organizations (
          id,
          name,
          max_members
        )
      `)
      .eq("user_id", user.id)
      .single()

    if (!myMembership || !["owner", "admin"].includes(myMembership.role)) {
      return NextResponse.json(
        { error: "Only admins can invite members" },
        { status: 403 }
      )
    }

    const org = myMembership.organization as any

    // Check if already at max members
    const { count: memberCount } = await supabase
      .from("organization_members")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", myMembership.organization_id)

    const { count: pendingCount } = await supabase
      .from("organization_invites")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", myMembership.organization_id)
      .eq("status", "pending")

    if ((memberCount || 0) + (pendingCount || 0) >= org.max_members) {
      return NextResponse.json(
        { error: `Organization is at maximum capacity (${org.max_members} members)` },
        { status: 400 }
      )
    }

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from("organization_members")
      .select("id")
      .eq("organization_id", myMembership.organization_id)
      .eq("user_id", (
        await supabase
          .from("profiles")
          .select("id")
          .eq("email", normalizedEmail)
          .single()
      ).data?.id || "00000000-0000-0000-0000-000000000000")
      .single()

    if (existingMember) {
      return NextResponse.json(
        { error: "User is already a member of this organization" },
        { status: 400 }
      )
    }

    // Check if there's already a pending invite
    const { data: existingInvite } = await supabase
      .from("organization_invites")
      .select("id")
      .eq("organization_id", myMembership.organization_id)
      .eq("email", normalizedEmail)
      .eq("status", "pending")
      .single()

    if (existingInvite) {
      return NextResponse.json(
        { error: "An invite has already been sent to this email" },
        { status: 400 }
      )
    }

    // Generate invite token
    const token = nanoid(32)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // Invite expires in 7 days

    // Create the invite
    const { data: invite, error: inviteError } = await supabase
      .from("organization_invites")
      .insert({
        organization_id: myMembership.organization_id,
        email: normalizedEmail,
        role,
        token,
        invited_by: user.id,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single()

    if (inviteError) {
      console.error("Error creating invite:", inviteError)
      return NextResponse.json({ error: "Failed to create invite" }, { status: 500 })
    }

    // Get inviter's name
    const { data: inviterProfile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", user.id)
      .single()

    // Send invite email
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const inviteUrl = `${appUrl}/invite/${token}`

    await sendTeamInviteEmail(
      normalizedEmail,
      org.name,
      inviterProfile?.full_name || inviterProfile?.email || "A team member",
      inviteUrl
    )

    return NextResponse.json({ invite })
  } catch (error) {
    console.error("Invite error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/team/invite - Revoke an invite
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
    const inviteId = searchParams.get("inviteId")

    if (!inviteId) {
      return NextResponse.json({ error: "Invite ID required" }, { status: 400 })
    }

    // Get user's organization and verify admin/owner role
    const { data: myMembership } = await supabase
      .from("organization_members")
      .select("organization_id, role")
      .eq("user_id", user.id)
      .single()

    if (!myMembership || !["owner", "admin"].includes(myMembership.role)) {
      return NextResponse.json(
        { error: "Only admins can revoke invites" },
        { status: 403 }
      )
    }

    // Update the invite status
    const { error: updateError } = await supabase
      .from("organization_invites")
      .update({ status: "revoked" })
      .eq("id", inviteId)
      .eq("organization_id", myMembership.organization_id)
      .eq("status", "pending")

    if (updateError) {
      console.error("Error revoking invite:", updateError)
      return NextResponse.json({ error: "Failed to revoke invite" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Revoke invite error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
