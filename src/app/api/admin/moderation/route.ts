import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Admin email whitelist - add admin emails here
const ADMIN_EMAILS = [
  'kyle@foxtrove.ai',
  'admin@bidvet.com',
]

async function isAdmin(supabase: Awaited<ReturnType<typeof createClient>>): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return false
  return ADMIN_EMAILS.includes(user.email)
}

/**
 * GET /api/admin/moderation
 * List training contributions for moderation
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient()

  if (!(await isAdmin(supabase))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const searchParams = request.nextUrl.searchParams
  const status = searchParams.get('status') || 'pending'
  const tradeType = searchParams.get('trade_type')
  const correctionType = searchParams.get('correction_type')
  const limit = parseInt(searchParams.get('limit') || '50')
  const offset = parseInt(searchParams.get('offset') || '0')

  let query = supabase
    .from('training_contributions')
    .select('*', { count: 'exact' })
    .order('contributed_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (status !== 'all') {
    query = query.eq('moderation_status', status)
  }

  if (tradeType) {
    query = query.eq('trade_type', tradeType)
  }

  if (correctionType) {
    query = query.eq('correction_type', correctionType)
  }

  const { data, error, count } = await query

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch contributions' }, { status: 500 })
  }

  return NextResponse.json({
    contributions: data,
    total: count,
    offset,
    limit,
  })
}

/**
 * PATCH /api/admin/moderation
 * Update moderation status for a contribution
 */
export async function PATCH(request: NextRequest) {
  const supabase = await createClient()

  if (!(await isAdmin(supabase))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const body = await request.json()
  const { id, status, notes } = body

  if (!id || !status) {
    return NextResponse.json({ error: 'Missing id or status' }, { status: 400 })
  }

  if (!['approved', 'rejected'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const { error } = await supabase
    .from('training_contributions')
    .update({
      moderation_status: status,
      moderated_at: new Date().toISOString(),
      moderation_notes: notes || null,
    })
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

/**
 * POST /api/admin/moderation/bulk
 * Bulk update moderation status
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()

  if (!(await isAdmin(supabase))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const body = await request.json()
  const { ids, status, notes } = body

  if (!ids || !Array.isArray(ids) || ids.length === 0 || !status) {
    return NextResponse.json({ error: 'Missing ids array or status' }, { status: 400 })
  }

  if (!['approved', 'rejected'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const { error } = await supabase
    .from('training_contributions')
    .update({
      moderation_status: status,
      moderated_at: new Date().toISOString(),
      moderation_notes: notes || null,
    })
    .in('id', ids)

  if (error) {
    return NextResponse.json({ error: 'Failed to update statuses' }, { status: 500 })
  }

  return NextResponse.json({ success: true, updated: ids.length })
}
