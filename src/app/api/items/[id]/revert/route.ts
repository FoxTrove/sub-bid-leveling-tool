import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Verify item belongs to user AND get current values
  const { data: currentItem, error: itemError } = await supabase
    .from("extracted_items")
    .select(`
      *,
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

  if (itemError || !currentItem) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 })
  }

  // Type assertion for nested query result
  const bidDoc = currentItem.bid_documents as unknown as {
    id: string
    projects: { id: string; user_id: string }
  }

  if (bidDoc.projects.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // Parse request body
  const body = await request.json()
  const { batch_id, field_name } = body

  // Validate: need either batch_id (revert whole batch) or field_name (revert specific field)
  if (!batch_id && !field_name) {
    return NextResponse.json(
      { error: "Must provide batch_id or field_name to revert" },
      { status: 400 }
    )
  }

  // Build query for history records to revert
  let historyQuery = supabase
    .from("item_edit_history")
    .select("*")
    .eq("item_id", id)
    .order("created_at", { ascending: false })

  if (batch_id) {
    historyQuery = historyQuery.eq("batch_id", batch_id)
  } else if (field_name) {
    // Get the most recent change for this field
    historyQuery = historyQuery.eq("field_name", field_name).limit(1)
  }

  const { data: historyRecords, error: historyError } = await historyQuery

  if (historyError) {
    console.error("[Items/Revert] History fetch error:", historyError.message)
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 })
  }

  if (!historyRecords || historyRecords.length === 0) {
    return NextResponse.json({ error: "No history found to revert" }, { status: 404 })
  }

  // Build update object with old values
  const updateData: Record<string, unknown> = {}
  const revertedFields: string[] = []

  for (const record of historyRecords) {
    updateData[record.field_name] = record.old_value
    revertedFields.push(record.field_name)
  }

  // Perform update
  const { data: updatedItem, error: updateError } = await supabase
    .from("extracted_items")
    .update(updateData)
    .eq("id", id)
    .select()
    .single()

  if (updateError) {
    console.error("[Items/Revert] Update error:", updateError.message)
    return NextResponse.json({ error: "Failed to revert item" }, { status: 500 })
  }

  // Record the revert in history
  const revertBatchId = uuidv4()
  const revertHistoryRecords = revertedFields.map((fieldName) => {
    const historyRecord = historyRecords.find((r) => r.field_name === fieldName)!
    return {
      item_id: id,
      user_id: user.id,
      field_name: fieldName,
      old_value: historyRecord.new_value, // What it was before revert
      new_value: historyRecord.old_value, // What we're reverting to
      change_reason: `Reverted to previous value (batch: ${batch_id || "single field"})`,
      batch_id: revertBatchId,
    }
  })

  const { error: revertHistoryError } = await supabase
    .from("item_edit_history")
    .insert(revertHistoryRecords)

  if (revertHistoryError) {
    console.error("[Items/Revert] History recording error:", revertHistoryError.message)
    // Continue anyway - revert was successful
  }

  return NextResponse.json({
    item: updatedItem,
    reverted: true,
    revertedFields,
    revertBatchId,
  })
}
