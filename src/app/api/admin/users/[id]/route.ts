import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { isAdminEmail } from '@/lib/admin/constants'

/**
 * GET /api/admin/users/[id]
 * Get detailed user info with stats
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user?.email || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { id } = await params
  const adminClient = createAdminClient()

  try {
    // Get user profile
    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get user's projects with counts
    const { data: projects, count: projectCount } = await adminClient
      .from('projects')
      .select('id, name, trade_type, status, created_at', { count: 'exact' })
      .eq('user_id', id)
      .order('created_at', { ascending: false })
      .limit(10)

    // Get completed comparisons count
    const { count: completedCount } = await adminClient
      .from('projects')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', id)
      .eq('status', 'complete')

    // Get document count
    const { data: userProjects } = await adminClient
      .from('projects')
      .select('id')
      .eq('user_id', id)

    const projectIds = userProjects?.map(p => p.id) || []
    let documentCount = 0

    if (projectIds.length > 0) {
      const { count } = await adminClient
        .from('bid_documents')
        .select('id', { count: 'exact', head: true })
        .in('project_id', projectIds)
      documentCount = count || 0
    }

    // Get recent credit transactions
    const { data: transactions } = await adminClient
      .from('credit_transactions')
      .select('*')
      .eq('user_id', id)
      .order('created_at', { ascending: false })
      .limit(10)

    // Get organization info if user is part of one
    let organization = null
    if (profile.organization_id) {
      const { data: org } = await adminClient
        .from('organizations')
        .select('id, name, slug, plan, max_members')
        .eq('id', profile.organization_id)
        .single()
      organization = org
    }

    return NextResponse.json({
      user: profile,
      stats: {
        projectCount: projectCount || 0,
        completedComparisons: completedCount || 0,
        documentCount,
      },
      recentProjects: projects || [],
      recentTransactions: transactions || [],
      organization,
    })
  } catch (error) {
    console.error('User detail error:', error)
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
  }
}

/**
 * PATCH /api/admin/users/[id]
 * Update user plan, credits, or other admin-editable fields
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user?.email || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { id } = await params
  const adminClient = createAdminClient()
  const body = await request.json()

  const {
    plan,
    subscription_status,
    credit_adjustment,
    credit_adjustment_reason,
    promo_code,
  } = body

  try {
    // Build update object
    const updates: Record<string, unknown> = {}

    if (plan !== undefined) {
      updates.plan = plan
    }

    if (subscription_status !== undefined) {
      updates.subscription_status = subscription_status
    }

    if (promo_code !== undefined) {
      updates.promo_code = promo_code
      updates.promo_applied_at = new Date().toISOString()
    }

    // Handle credit adjustment
    if (credit_adjustment !== undefined && credit_adjustment !== 0) {
      // Get current balance
      const { data: profile } = await adminClient
        .from('profiles')
        .select('credit_balance')
        .eq('id', id)
        .single()

      const currentBalance = profile?.credit_balance || 0
      const newBalance = Math.max(0, currentBalance + credit_adjustment)
      updates.credit_balance = newBalance

      // Log the transaction
      await adminClient.from('credit_transactions').insert({
        user_id: id,
        type: credit_adjustment > 0 ? 'bonus' : 'usage',
        amount: credit_adjustment,
        balance_after: newBalance,
        description: credit_adjustment_reason || `Admin adjustment: ${credit_adjustment > 0 ? '+' : ''}${credit_adjustment} credits`,
      })
    }

    // Update profile if there are changes
    if (Object.keys(updates).length > 0) {
      updates.updated_at = new Date().toISOString()

      const { error: updateError } = await adminClient
        .from('profiles')
        .update(updates)
        .eq('id', id)

      if (updateError) throw updateError
    }

    // Fetch updated user
    const { data: updatedProfile } = await adminClient
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single()

    return NextResponse.json({
      success: true,
      user: updatedProfile,
    })
  } catch (error) {
    console.error('User update error:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}
