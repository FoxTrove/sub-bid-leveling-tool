import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { isAdminEmail } from '@/lib/admin/constants'

/**
 * GET /api/admin/users
 * List users with search, filter, and pagination
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user?.email || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const searchParams = request.nextUrl.searchParams
  const search = searchParams.get('search') || ''
  const plan = searchParams.get('plan') // 'free', 'pro', 'team', 'enterprise'
  const status = searchParams.get('status') // 'active', 'inactive', 'trialing'
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const sortBy = searchParams.get('sort') || 'created_at'
  const sortOrder = searchParams.get('order') === 'asc' ? true : false

  const adminClient = createAdminClient()
  const offset = (page - 1) * limit

  try {
    // Build the query
    let query = adminClient
      .from('profiles')
      .select(`
        id,
        email,
        full_name,
        company_name,
        plan,
        subscription_status,
        credit_balance,
        comparisons_used,
        created_at,
        last_active_at,
        promo_code,
        stripe_customer_id,
        organization_id
      `, { count: 'exact' })

    // Apply search filter (email or name)
    if (search) {
      query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%,company_name.ilike.%${search}%`)
    }

    // Apply plan filter
    if (plan) {
      query = query.eq('plan', plan)
    }

    // Apply status filter
    if (status) {
      if (status === 'active') {
        query = query.eq('subscription_status', 'active')
      } else if (status === 'inactive') {
        query = query.or('subscription_status.eq.inactive,subscription_status.is.null')
      } else if (status === 'trialing') {
        query = query.eq('subscription_status', 'trialing')
      }
    }

    // Apply sorting
    const validSortColumns = ['created_at', 'email', 'plan', 'credit_balance', 'last_active_at']
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'created_at'
    query = query.order(sortColumn, { ascending: sortOrder })

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: users, error, count } = await query

    if (error) throw error

    // Get project counts for each user
    const userIds = users?.map(u => u.id) || []
    let projectCounts: Record<string, number> = {}

    if (userIds.length > 0) {
      const { data: projects } = await adminClient
        .from('projects')
        .select('user_id')
        .in('user_id', userIds)

      projectCounts = (projects || []).reduce((acc, p) => {
        acc[p.user_id] = (acc[p.user_id] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    }

    // Enrich users with project counts
    const enrichedUsers = users?.map(u => ({
      ...u,
      project_count: projectCounts[u.id] || 0,
    }))

    return NextResponse.json({
      users: enrichedUsers,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error('Users list error:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}
