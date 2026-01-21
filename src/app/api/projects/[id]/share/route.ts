import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET /api/projects/[id]/share - Get shares for a project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify user owns the project
    const { data: project } = await supabase
      .from("projects")
      .select("id, user_id")
      .eq("id", projectId)
      .single()

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    if (project.user_id !== user.id) {
      return NextResponse.json({ error: "Only project owner can view shares" }, { status: 403 })
    }

    // Get shares with user info
    const { data: shares, error: sharesError } = await supabase
      .from("project_shares")
      .select(`
        id,
        permission,
        created_at,
        shared_with:profiles!project_shares_shared_with_user_id_fkey (
          id,
          email,
          full_name
        )
      `)
      .eq("project_id", projectId)

    if (sharesError) {
      console.error("Error fetching shares:", sharesError)
      return NextResponse.json({ error: "Failed to fetch shares" }, { status: 500 })
    }

    return NextResponse.json({ shares: shares || [] })
  } catch (error) {
    console.error("Shares fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/projects/[id]/share - Share a project with a user
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { email, permission = "view" } = body

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email required" }, { status: 400 })
    }

    if (!["view", "comment", "edit"].includes(permission)) {
      return NextResponse.json({ error: "Invalid permission level" }, { status: 400 })
    }

    // Verify user owns the project
    const { data: project } = await supabase
      .from("projects")
      .select("id, user_id, name")
      .eq("id", projectId)
      .single()

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    if (project.user_id !== user.id) {
      return NextResponse.json({ error: "Only project owner can share" }, { status: 403 })
    }

    // Find the user to share with
    const { data: targetUser } = await supabase
      .from("profiles")
      .select("id, email, full_name")
      .eq("email", email.toLowerCase())
      .single()

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (targetUser.id === user.id) {
      return NextResponse.json({ error: "Cannot share with yourself" }, { status: 400 })
    }

    // Check if already shared
    const { data: existingShare } = await supabase
      .from("project_shares")
      .select("id")
      .eq("project_id", projectId)
      .eq("shared_with_user_id", targetUser.id)
      .single()

    if (existingShare) {
      return NextResponse.json({ error: "Project already shared with this user" }, { status: 400 })
    }

    // Create share
    const { data: share, error: createError } = await supabase
      .from("project_shares")
      .insert({
        project_id: projectId,
        owner_user_id: user.id,
        shared_with_user_id: targetUser.id,
        permission,
      })
      .select(`
        id,
        permission,
        created_at,
        shared_with:profiles!project_shares_shared_with_user_id_fkey (
          id,
          email,
          full_name
        )
      `)
      .single()

    if (createError) {
      console.error("Error creating share:", createError)
      return NextResponse.json({ error: "Failed to share project" }, { status: 500 })
    }

    // Notify the user
    const { data: currentUser } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", user.id)
      .single()

    const sharerName = currentUser?.full_name || currentUser?.email || "Someone"

    await supabase.from("notifications").insert({
      user_id: targetUser.id,
      actor_id: user.id,
      type: "project_shared",
      title: "Project shared with you",
      message: `${sharerName} shared "${project.name}" with you`,
      link: `/compare/${projectId}`,
    })

    return NextResponse.json({ share })
  } catch (error) {
    console.error("Share creation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/projects/[id]/share - Remove a share
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const shareId = searchParams.get("shareId")

    if (!shareId) {
      return NextResponse.json({ error: "Share ID required" }, { status: 400 })
    }

    // Verify user owns the project
    const { data: project } = await supabase
      .from("projects")
      .select("id, user_id")
      .eq("id", projectId)
      .single()

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    if (project.user_id !== user.id) {
      return NextResponse.json({ error: "Only project owner can remove shares" }, { status: 403 })
    }

    // Delete the share
    const { error: deleteError } = await supabase
      .from("project_shares")
      .delete()
      .eq("id", shareId)
      .eq("project_id", projectId)

    if (deleteError) {
      console.error("Error removing share:", deleteError)
      return NextResponse.json({ error: "Failed to remove share" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Share deletion error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH /api/projects/[id]/share - Update share permission
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { shareId, permission } = body

    if (!shareId || !permission) {
      return NextResponse.json({ error: "Share ID and permission required" }, { status: 400 })
    }

    if (!["view", "comment", "edit"].includes(permission)) {
      return NextResponse.json({ error: "Invalid permission level" }, { status: 400 })
    }

    // Verify user owns the project
    const { data: project } = await supabase
      .from("projects")
      .select("id, user_id")
      .eq("id", projectId)
      .single()

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    if (project.user_id !== user.id) {
      return NextResponse.json({ error: "Only project owner can update shares" }, { status: 403 })
    }

    // Update the share
    const { data: share, error: updateError } = await supabase
      .from("project_shares")
      .update({ permission })
      .eq("id", shareId)
      .eq("project_id", projectId)
      .select()
      .single()

    if (updateError) {
      console.error("Error updating share:", updateError)
      return NextResponse.json({ error: "Failed to update share" }, { status: 500 })
    }

    return NextResponse.json({ share })
  } catch (error) {
    console.error("Share update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
