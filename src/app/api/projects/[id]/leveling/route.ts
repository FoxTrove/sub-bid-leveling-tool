import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { LevelingConfig } from '@/types'

/**
 * GET /api/projects/[id]/leveling
 *
 * Retrieve the leveling configuration for a project
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params
  const supabase = await createClient()

  // Verify user authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get comparison result with leveling config
  const { data: result, error } = await supabase
    .from('comparison_results')
    .select('leveling_json')
    .eq('project_id', projectId)
    .single()

  if (error) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  return NextResponse.json({
    leveling: result.leveling_json || null,
  })
}

/**
 * PATCH /api/projects/[id]/leveling
 *
 * Update the leveling configuration for a project.
 * Saves baseline selections and recalculates leveled totals.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params
  const supabase = await createClient()

  // Verify user authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify project ownership
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id, user_id')
    .eq('id', projectId)
    .single()

  if (projectError || !project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  if (project.user_id !== user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  // Parse request body
  const body = await request.json()
  const levelingConfig: LevelingConfig = body.leveling

  if (!levelingConfig) {
    return NextResponse.json(
      { error: 'Missing leveling configuration' },
      { status: 400 }
    )
  }

  // Update comparison result with leveling config
  const { error: updateError } = await supabase
    .from('comparison_results')
    .update({
      leveling_json: levelingConfig,
    })
    .eq('project_id', projectId)

  if (updateError) {
    console.error('Failed to update leveling config:', updateError)
    return NextResponse.json(
      { error: 'Failed to save leveling configuration' },
      { status: 500 }
    )
  }

  // Update extracted_items with is_baseline and leveled_price
  // Clear all baselines first
  await supabase
    .from('extracted_items')
    .update({ is_baseline: false, leveled_price: null })
    .in(
      'bid_document_id',
      (
        await supabase
          .from('bid_documents')
          .select('id')
          .eq('project_id', projectId)
      ).data?.map((d) => d.id) || []
    )

  // Set new baselines and calculate leveled prices
  for (const baseline of levelingConfig.baselines) {
    // Find items matching this baseline description
    const { data: matchingItems } = await supabase
      .from('extracted_items')
      .select('id, unit_price, bid_document_id')
      .eq('description', baseline.normalizedDescription)
      .in(
        'bid_document_id',
        (
          await supabase
            .from('bid_documents')
            .select('id')
            .eq('project_id', projectId)
        ).data?.map((d) => d.id) || []
      )

    if (matchingItems) {
      for (const item of matchingItems) {
        const isBaseline = item.bid_document_id === baseline.baselineContractorId
        const leveledPrice = item.unit_price
          ? baseline.baselineQuantity * item.unit_price
          : null

        await supabase
          .from('extracted_items')
          .update({
            is_baseline: isBaseline,
            leveled_price: leveledPrice,
          })
          .eq('id', item.id)
      }
    }
  }

  return NextResponse.json({
    success: true,
    leveling: levelingConfig,
  })
}

/**
 * DELETE /api/projects/[id]/leveling
 *
 * Clear the leveling configuration for a project
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params
  const supabase = await createClient()

  // Verify user authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify project ownership
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id, user_id')
    .eq('id', projectId)
    .single()

  if (projectError || !project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  if (project.user_id !== user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  // Clear leveling config
  await supabase
    .from('comparison_results')
    .update({ leveling_json: null })
    .eq('project_id', projectId)

  // Clear baselines from extracted_items
  await supabase
    .from('extracted_items')
    .update({ is_baseline: false, leveled_price: null })
    .in(
      'bid_document_id',
      (
        await supabase
          .from('bid_documents')
          .select('id')
          .eq('project_id', projectId)
      ).data?.map((d) => d.id) || []
    )

  return NextResponse.json({ success: true })
}
