import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET /api/notifications - Get user's notifications
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get pagination and filter params
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50)
    const offset = parseInt(searchParams.get("offset") || "0")
    const unreadOnly = searchParams.get("unread") === "true"

    // Build query
    let query = supabase
      .from("notifications")
      .select(`
        id,
        type,
        title,
        message,
        link,
        read,
        created_at,
        actor:profiles!notifications_actor_id_fkey (
          id,
          email,
          full_name
        )
      `, { count: "exact" })
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (unreadOnly) {
      query = query.eq("read", false)
    }

    const { data: notifications, error: notificationsError, count } = await query
      .range(offset, offset + limit - 1)

    if (notificationsError) {
      console.error("Error fetching notifications:", notificationsError)
      return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 })
    }

    // Get unread count
    const { count: unreadCount } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("read", false)

    return NextResponse.json({
      notifications: notifications || [],
      total: count || 0,
      unreadCount: unreadCount || 0,
      hasMore: (count || 0) > offset + limit,
    })
  } catch (error) {
    console.error("Notifications fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH /api/notifications - Mark notifications as read
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
    const { notificationIds, markAll } = body

    if (markAll) {
      // Mark all as read
      const { error: updateError } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", user.id)
        .eq("read", false)

      if (updateError) {
        console.error("Error marking all notifications as read:", updateError)
        return NextResponse.json({ error: "Failed to update notifications" }, { status: 500 })
      }
    } else if (notificationIds && Array.isArray(notificationIds)) {
      // Mark specific notifications as read
      const { error: updateError } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", user.id)
        .in("id", notificationIds)

      if (updateError) {
        console.error("Error marking notifications as read:", updateError)
        return NextResponse.json({ error: "Failed to update notifications" }, { status: 500 })
      }
    } else {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Notifications update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/notifications - Delete notifications
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
    const notificationId = searchParams.get("id")
    const deleteAll = searchParams.get("all") === "true"

    if (deleteAll) {
      // Delete all notifications
      const { error: deleteError } = await supabase
        .from("notifications")
        .delete()
        .eq("user_id", user.id)

      if (deleteError) {
        console.error("Error deleting all notifications:", deleteError)
        return NextResponse.json({ error: "Failed to delete notifications" }, { status: 500 })
      }
    } else if (notificationId) {
      // Delete specific notification
      const { error: deleteError } = await supabase
        .from("notifications")
        .delete()
        .eq("user_id", user.id)
        .eq("id", notificationId)

      if (deleteError) {
        console.error("Error deleting notification:", deleteError)
        return NextResponse.json({ error: "Failed to delete notification" }, { status: 500 })
      }
    } else {
      return NextResponse.json({ error: "Notification ID required" }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Notifications delete error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
