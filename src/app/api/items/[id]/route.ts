import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"

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

  // Return the item without the nested bid_documents
  const { bid_documents, ...itemData } = item
  return NextResponse.json({ item: itemData })
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Verify item belongs to user AND get current values for history
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

  // Parse update data
  const body = await request.json()
  const {
    description,
    category,
    total_price,
    unit_price,
    quantity,
    unit,
    is_exclusion,
    user_modified,
    change_reason, // Optional reason for the change
  } = body

  // Build update object with only provided fields
  const updateData: Record<string, unknown> = {}
  if (description !== undefined) updateData.description = description
  if (category !== undefined) updateData.category = category
  if (total_price !== undefined) updateData.total_price = total_price
  if (unit_price !== undefined) updateData.unit_price = unit_price
  if (quantity !== undefined) updateData.quantity = quantity
  if (unit !== undefined) updateData.unit = unit
  if (is_exclusion !== undefined) updateData.is_exclusion = is_exclusion
  if (user_modified !== undefined) updateData.user_modified = user_modified

  // Generate a batch ID for this edit session (groups multiple field changes)
  const batchId = uuidv4()

  // Build history records for changed fields
  const historyRecords: Array<{
    item_id: string
    user_id: string
    field_name: string
    old_value: unknown
    new_value: unknown
    change_reason: string | null
    batch_id: string
  }> = []

  // Track which fields actually changed
  const changedFields: string[] = []

  for (const [field, newValue] of Object.entries(updateData)) {
    // Skip user_modified as it's metadata, not a data field
    if (field === "user_modified") continue

    const oldValue = (currentItem as Record<string, unknown>)[field]

    // Only record if the value actually changed
    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      changedFields.push(field)
      historyRecords.push({
        item_id: id,
        user_id: user.id,
        field_name: field,
        old_value: oldValue,
        new_value: newValue,
        change_reason: change_reason || null,
        batch_id: batchId,
      })
    }
  }

  // If nothing actually changed, just return the current item
  if (changedFields.length === 0) {
    const { bid_documents, ...itemData } = currentItem
    return NextResponse.json({ item: itemData, changed: false })
  }

  // Perform update
  const { data: updatedItem, error: updateError } = await supabase
    .from("extracted_items")
    .update(updateData)
    .eq("id", id)
    .select()
    .single()

  if (updateError) {
    console.error("[Items] Update error:", updateError.message)
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 })
  }

  // Record history (don't fail the request if history recording fails)
  if (historyRecords.length > 0) {
    const { error: historyError } = await supabase
      .from("item_edit_history")
      .insert(historyRecords)

    if (historyError) {
      console.error("[Items] History recording error:", historyError.message)
      // Continue anyway - history is for audit, not critical
    }
  }

  return NextResponse.json({
    item: updatedItem,
    changed: true,
    changedFields,
    batchId
  })
}
