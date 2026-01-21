import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET /api/projects/[id]/comments - Get comments for a project
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

    // Verify user has access to project (owner or shared)
    const { data: project } = await supabase
      .from("projects")
      .select("id, user_id")
      .eq("id", projectId)
      .single()

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Check if user owns project or has shared access
    let hasAccess = project.user_id === user.id

    if (!hasAccess) {
      // Check shared access
      const { data: share } = await supabase
        .from("project_shares")
        .select("id")
        .eq("project_id", projectId)
        .eq("shared_with_user_id", user.id)
        .single()

      hasAccess = !!share
    }

    if (!hasAccess) {
      // Check team access
      const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .single()

      if (profile?.organization_id) {
        const { data: ownerProfile } = await supabase
          .from("profiles")
          .select("organization_id")
          .eq("id", project.user_id)
          .single()

        hasAccess = profile.organization_id === ownerProfile?.organization_id
      }
    }

    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Get comments with user info
    const { data: comments, error: commentsError } = await supabase
      .from("comparison_comments")
      .select(`
        id,
        content,
        mentions,
        parent_id,
        created_at,
        updated_at,
        user:profiles!comparison_comments_user_id_fkey (
          id,
          email,
          full_name
        )
      `)
      .eq("project_id", projectId)
      .order("created_at", { ascending: true })

    if (commentsError) {
      console.error("Error fetching comments:", commentsError)
      return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 })
    }

    return NextResponse.json({ comments: comments || [] })
  } catch (error) {
    console.error("Comments fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/projects/[id]/comments - Add a comment to a project
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
    const { content, parentId } = body

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json({ error: "Comment content required" }, { status: 400 })
    }

    // Verify user has access to project
    const { data: project } = await supabase
      .from("projects")
      .select("id, user_id, name")
      .eq("id", projectId)
      .single()

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Check access (simplified - owner, shared, or team)
    let hasAccess = project.user_id === user.id
    let organizationId: string | null = null

    if (!hasAccess) {
      const { data: share } = await supabase
        .from("project_shares")
        .select("id")
        .eq("project_id", projectId)
        .eq("shared_with_user_id", user.id)
        .single()

      hasAccess = !!share
    }

    if (!hasAccess) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .single()

      if (profile?.organization_id) {
        organizationId = profile.organization_id

        const { data: ownerProfile } = await supabase
          .from("profiles")
          .select("organization_id")
          .eq("id", project.user_id)
          .single()

        hasAccess = profile.organization_id === ownerProfile?.organization_id
      }
    }

    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Extract @mentions from content
    const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g
    const mentions: string[] = []
    let match
    while ((match = mentionRegex.exec(content)) !== null) {
      mentions.push(match[2]) // Extract user ID from mention format @[Name](user_id)
    }

    // Create comment
    const { data: comment, error: createError } = await supabase
      .from("comparison_comments")
      .insert({
        project_id: projectId,
        user_id: user.id,
        content: content.trim(),
        mentions: mentions.length > 0 ? mentions : null,
        parent_id: parentId || null,
      })
      .select(`
        id,
        content,
        mentions,
        parent_id,
        created_at,
        updated_at,
        user:profiles!comparison_comments_user_id_fkey (
          id,
          email,
          full_name
        )
      `)
      .single()

    if (createError) {
      console.error("Error creating comment:", createError)
      return NextResponse.json({ error: "Failed to create comment" }, { status: 500 })
    }

    // Create notifications for mentioned users
    if (mentions.length > 0) {
      const { data: currentUser } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", user.id)
        .single()

      const actorName = currentUser?.full_name || currentUser?.email || "Someone"

      const notifications = mentions
        .filter(mentionedUserId => mentionedUserId !== user.id) // Don't notify self
        .map(mentionedUserId => ({
          user_id: mentionedUserId,
          actor_id: user.id,
          type: "mention" as const,
          title: "You were mentioned",
          message: `${actorName} mentioned you in a comment on "${project.name}"`,
          link: `/compare/${projectId}?comment=${comment.id}`,
        }))

      if (notifications.length > 0) {
        await supabase.from("notifications").insert(notifications)
      }
    }

    // Log activity if team context
    if (organizationId) {
      await supabase.from("team_activities").insert({
        organization_id: organizationId,
        user_id: user.id,
        project_id: projectId,
        activity_type: "comment_added",
        metadata: { comment_preview: content.slice(0, 100) },
      })
    }

    return NextResponse.json({ comment })
  } catch (error) {
    console.error("Comment creation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/projects/[id]/comments - Delete a comment
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
    const commentId = searchParams.get("commentId")

    if (!commentId) {
      return NextResponse.json({ error: "Comment ID required" }, { status: 400 })
    }

    // Get the comment and verify ownership
    const { data: comment } = await supabase
      .from("comparison_comments")
      .select("id, user_id")
      .eq("id", commentId)
      .eq("project_id", projectId)
      .single()

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 })
    }

    if (comment.user_id !== user.id) {
      return NextResponse.json({ error: "Can only delete your own comments" }, { status: 403 })
    }

    // Delete the comment
    const { error: deleteError } = await supabase
      .from("comparison_comments")
      .delete()
      .eq("id", commentId)

    if (deleteError) {
      console.error("Error deleting comment:", deleteError)
      return NextResponse.json({ error: "Failed to delete comment" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Comment deletion error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
