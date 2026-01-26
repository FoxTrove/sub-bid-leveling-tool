import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Verify item belongs to user via document -> project -> user chain
  const { data: item, error: itemError } = await supabase
    .from("extracted_items")
    .select(`
      id,
      bid_documents!inner (
        id,
        projects!inner (
          id,
          user_id
        )
      )
    `)
    .eq("id", id)
    .single()

  if (itemError || !item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 })
  }

  // Type assertion for nested query result
  const bidDoc = item.bid_documents as unknown as {
    id: string
    projects: { id: string; user_id: string }
  }

  if (bidDoc.projects.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // Get query params for pagination
  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get("limit") || "50")
  const offset = parseInt(searchParams.get("offset") || "0")

  // Fetch history records with user info
  const { data: history, error: historyError, count } = await supabase
    .from("item_edit_history")
    .select(`
      id,
      field_name,
      old_value,
      new_value,
      change_reason,
      batch_id,
      created_at,
      profiles:user_id (
        email,
        full_name
      )
    `, { count: "exact" })
    .eq("item_id", id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (historyError) {
    console.error("[Items/History] Fetch error:", historyError.message)
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 })
  }

  // Group history by batch_id for display
  const groupedHistory = new Map<string, {
    batch_id: string
    created_at: string
    user: { email: string; full_name: string | null } | null
    change_reason: string | null
    changes: Array<{
      field_name: string
      old_value: unknown
      new_value: unknown
    }>
  }>()

  for (const record of history || []) {
    const batchId = record.batch_id || record.id // Use record ID as batch if no batch_id

    if (!groupedHistory.has(batchId)) {
      groupedHistory.set(batchId, {
        batch_id: batchId,
        created_at: record.created_at,
        user: record.profiles as unknown as { email: string; full_name: string | null } | null,
        change_reason: record.change_reason,
        changes: []
      })
    }

    groupedHistory.get(batchId)!.changes.push({
      field_name: record.field_name,
      old_value: record.old_value,
      new_value: record.new_value,
    })
  }

  return NextResponse.json({
    history: Array.from(groupedHistory.values()),
    total: count || 0,
    limit,
    offset,
  })
}
