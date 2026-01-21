import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { isAdminEmail } from '@/lib/admin/constants'

/**
 * GET /api/admin/analytics/usage
 * Get usage metrics: projects, documents, active users
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user?.email || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const searchParams = request.nextUrl.searchParams
  const period = searchParams.get('period') || '30'
  const periodDays = parseInt(period)

  const adminClient = createAdminClient()
  const startDate = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000).toISOString()

  try {
    // Run all queries in parallel
    const [
      // Projects metrics
      totalProjectsResult,
      newProjectsResult,
      completedProjectsResult,
      projectsByStatusResult,

      // Documents metrics
      totalDocumentsResult,
      newDocumentsResult,
      processedDocumentsResult,

      // User activity
      dailyActiveResult,
      weeklyActiveResult,
      monthlyActiveResult,

      // Trade type distribution
      tradeTypesResult,

      // Historical metrics
      historicalResult,
    ] = await Promise.all([
      // Total projects
      adminClient
        .from('projects')
        .select('id', { count: 'exact', head: true }),

      // New projects in period
      adminClient
        .from('projects')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', startDate),

      // Completed projects in period
      adminClient
        .from('projects')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'complete')
        .gte('updated_at', startDate),

      // Projects by status
      adminClient
        .from('projects')
        .select('status'),

      // Total documents
      adminClient
        .from('bid_documents')
        .select('id', { count: 'exact', head: true }),

      // New documents in period
      adminClient
        .from('bid_documents')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', startDate),

      // Processed documents in period
      adminClient
        .from('bid_documents')
        .select('id', { count: 'exact', head: true })
        .eq('upload_status', 'processed')
        .gte('updated_at', startDate),

      // Daily active users (last 24h)
      adminClient
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .gte('last_active_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),

      // Weekly active users (last 7 days)
      adminClient
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .gte('last_active_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),

      // Monthly active users (last 30 days)
      adminClient
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .gte('last_active_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),

      // Trade type distribution
      adminClient
        .from('projects')
        .select('trade_type')
        .gte('created_at', startDate),

      // Historical daily metrics
      adminClient
        .from('admin_daily_metrics')
        .select('date, projects_created, documents_processed, active_users, comparisons_completed')
        .gte('date', startDate.split('T')[0])
        .order('date', { ascending: true }),
    ])

    // Calculate status distribution
    const statusCounts = (projectsByStatusResult.data || []).reduce((acc, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Calculate trade type distribution
    const tradeTypeCounts = (tradeTypesResult.data || []).reduce((acc, p) => {
      const trade = p.trade_type || 'Unknown'
      acc[trade] = (acc[trade] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Sort trade types by count
    const topTradeTypes = Object.entries(tradeTypeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([trade, count]) => ({ trade, count }))

    return NextResponse.json({
      projects: {
        total: totalProjectsResult.count || 0,
        newInPeriod: newProjectsResult.count || 0,
        completedInPeriod: completedProjectsResult.count || 0,
        byStatus: statusCounts,
      },
      documents: {
        total: totalDocumentsResult.count || 0,
        newInPeriod: newDocumentsResult.count || 0,
        processedInPeriod: processedDocumentsResult.count || 0,
      },
      activeUsers: {
        daily: dailyActiveResult.count || 0,
        weekly: weeklyActiveResult.count || 0,
        monthly: monthlyActiveResult.count || 0,
      },
      tradeTypes: topTradeTypes,
      trends: historicalResult.data || [],
    })
  } catch (error) {
    console.error('Usage analytics error:', error)
    return NextResponse.json({ error: 'Failed to fetch usage analytics' }, { status: 500 })
  }
}
