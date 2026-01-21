import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Plan prices in cents for MRR calculation
const PLAN_PRICES = {
  pro: { monthly: 9900, annual: 7900 },
  team: { monthly: 29900, annual: 24900 },
  enterprise: { monthly: 99900, annual: 79900 },
}

/**
 * POST /api/cron/admin-metrics-rollup
 * Aggregates daily metrics and stores them in admin_daily_metrics table
 *
 * This should be triggered daily via Vercel Cron or similar
 * Header: Authorization: Bearer {CRON_SECRET}
 */
export async function POST(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const adminClient = createAdminClient()

  // Get date for metrics (yesterday if run after midnight, or today for manual runs)
  const searchParams = request.nextUrl.searchParams
  const dateParam = searchParams.get('date')
  const targetDate = dateParam
    ? new Date(dateParam)
    : new Date(Date.now() - 24 * 60 * 60 * 1000) // Yesterday

  const dateStr = targetDate.toISOString().split('T')[0]
  const startOfDay = `${dateStr}T00:00:00.000Z`
  const endOfDay = `${dateStr}T23:59:59.999Z`

  try {
    // Run all metric queries in parallel
    const [
      newUsersResult,
      totalUsersResult,
      activeUsersResult,
      subscriptionsResult,
      projectsResult,
      documentsResult,
      comparisonsResult,
      creditTransactionsResult,
      aiMetricsResult,
    ] = await Promise.all([
      // New users on this day
      adminClient
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', startOfDay)
        .lte('created_at', endOfDay),

      // Total users as of this day
      adminClient
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .lte('created_at', endOfDay),

      // Active users (with activity in last 24h)
      adminClient
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .gte('last_active_at', startOfDay)
        .lte('last_active_at', endOfDay),

      // Subscription data for MRR calculation
      adminClient
        .from('profiles')
        .select('plan, billing_cycle, subscription_status')
        .eq('subscription_status', 'active')
        .lte('created_at', endOfDay),

      // Projects created on this day
      adminClient
        .from('projects')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', startOfDay)
        .lte('created_at', endOfDay),

      // Documents processed on this day
      adminClient
        .from('bid_documents')
        .select('id', { count: 'exact', head: true })
        .eq('upload_status', 'processed')
        .gte('updated_at', startOfDay)
        .lte('updated_at', endOfDay),

      // Comparisons completed on this day
      adminClient
        .from('projects')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'complete')
        .gte('updated_at', startOfDay)
        .lte('updated_at', endOfDay),

      // Credit transactions on this day
      adminClient
        .from('credit_transactions')
        .select('type, amount')
        .gte('created_at', startOfDay)
        .lte('created_at', endOfDay),

      // AI pipeline metrics for this day
      adminClient
        .from('ai_pipeline_metrics')
        .select('extraction_success, avg_confidence_score')
        .gte('created_at', startOfDay)
        .lte('created_at', endOfDay),
    ])

    // Calculate MRR from subscriptions
    let mrrCents = 0
    subscriptionsResult.data?.forEach((sub) => {
      const plan = sub.plan as keyof typeof PLAN_PRICES
      if (PLAN_PRICES[plan]) {
        const price = sub.billing_cycle === 'annual'
          ? PLAN_PRICES[plan].annual
          : PLAN_PRICES[plan].monthly
        mrrCents += price
      }
    })

    // Calculate credit metrics
    const creditTxs = creditTransactionsResult.data || []
    const creditsUsed = creditTxs
      .filter((tx) => tx.type === 'usage')
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0)
    const creditsPurchased = creditTxs
      .filter((tx) => tx.type === 'purchase')
      .reduce((sum, tx) => sum + tx.amount, 0)

    // Calculate AI metrics
    const aiMetrics = aiMetricsResult.data || []
    const aiSuccessCount = aiMetrics.filter((m) => m.extraction_success).length
    const avgConfidence = aiMetrics.length > 0
      ? aiMetrics.reduce((sum, m) => sum + (Number(m.avg_confidence_score) || 0), 0) / aiMetrics.length
      : 0

    // Upsert the daily metrics
    const { error: upsertError } = await adminClient
      .from('admin_daily_metrics')
      .upsert({
        date: dateStr,
        new_users: newUsersResult.count || 0,
        total_users: totalUsersResult.count || 0,
        active_users: activeUsersResult.count || 0,
        active_subscriptions: subscriptionsResult.data?.length || 0,
        mrr_snapshot: mrrCents,
        projects_created: projectsResult.count || 0,
        documents_processed: documentsResult.count || 0,
        comparisons_completed: comparisonsResult.count || 0,
        credits_used: creditsUsed,
        credits_purchased: creditsPurchased,
        ai_analyses_count: aiMetrics.length,
        ai_success_count: aiSuccessCount,
        avg_confidence: avgConfidence,
      }, {
        onConflict: 'date',
      })

    if (upsertError) throw upsertError

    return NextResponse.json({
      success: true,
      date: dateStr,
      metrics: {
        new_users: newUsersResult.count || 0,
        total_users: totalUsersResult.count || 0,
        active_users: activeUsersResult.count || 0,
        active_subscriptions: subscriptionsResult.data?.length || 0,
        mrr_cents: mrrCents,
        projects_created: projectsResult.count || 0,
        documents_processed: documentsResult.count || 0,
        comparisons_completed: comparisonsResult.count || 0,
        ai_analyses: aiMetrics.length,
        ai_success_rate: aiMetrics.length > 0 ? aiSuccessCount / aiMetrics.length : 0,
      },
    })
  } catch (error) {
    console.error('Metrics rollup error:', error)
    return NextResponse.json({ error: 'Failed to aggregate metrics' }, { status: 500 })
  }
}

// Also allow GET for manual triggering
export async function GET(request: NextRequest) {
  return POST(request)
}
