import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET /api/team/activity - Get team activity feed
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

    // Get user's organization
    const { data: membership } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.id)
      .single()

    if (!membership) {
      return NextResponse.json({ error: "Not part of an organization" }, { status: 404 })
    }

    // Get pagination params
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50)
    const offset = parseInt(searchParams.get("offset") || "0")

    // Get team activities with user and project info
    const { data: activities, error: activitiesError, count } = await supabase
      .from("team_activities")
      .select(`
        id,
        activity_type,
        metadata,
        created_at,
        user:profiles!team_activities_user_id_fkey (
          id,
          email,
          full_name
        ),
        project:projects (
          id,
          name
        )
      `, { count: "exact" })
      .eq("organization_id", membership.organization_id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (activitiesError) {
      console.error("Error fetching activities:", activitiesError)
      return NextResponse.json({ error: "Failed to fetch activities" }, { status: 500 })
    }

    return NextResponse.json({
      activities: activities || [],
      total: count || 0,
      hasMore: (count || 0) > offset + limit,
    })
  } catch (error) {
    console.error("Team activity fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
