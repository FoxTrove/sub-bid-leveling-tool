import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

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

  return NextResponse.json({ item: updatedItem })
}
