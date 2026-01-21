import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { isAdminEmail } from '@/lib/admin/constants'

/**
 * GET /api/admin/analytics/overview
 * Get KPI summary for admin dashboard
 */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user?.email || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const adminClient = createAdminClient()

  try {
    // Run all queries in parallel
    const [
      totalUsersResult,
      newUsersResult,
      activeSubscriptionsResult,
      projectsResult,
      pendingModerationResult,
      activeTrialsResult,
      aiMetricsResult,
    ] = await Promise.all([
      // Total users
      adminClient.from('profiles').select('id', { count: 'exact', head: true }),

      // New users in last 7 days
      adminClient
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),

      // Active subscriptions (pro or team with active status)
      adminClient
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('subscription_status', 'active'),

      // Total projects
      adminClient.from('projects').select('id', { count: 'exact', head: true }),

      // Pending moderation items
      adminClient
        .from('training_contributions')
        .select('id', { count: 'exact', head: true })
        .eq('moderation_status', 'pending'),

      // Active trials (users created in last 30 days without active subscription)
      adminClient
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .neq('subscription_status', 'active'),

      // AI pipeline metrics for last 7 days
      adminClient
        .from('ai_pipeline_metrics')
        .select('extraction_success, avg_confidence_score')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
    ])

    // Calculate AI success rate
    const aiMetrics = aiMetricsResult.data || []
    const totalAnalyses = aiMetrics.length
    const successfulAnalyses = aiMetrics.filter(m => m.extraction_success).length
    const aiSuccessRate = totalAnalyses > 0 ? successfulAnalyses / totalAnalyses : 0
    const avgConfidence = totalAnalyses > 0
      ? aiMetrics.reduce((sum, m) => sum + (Number(m.avg_confidence_score) || 0), 0) / totalAnalyses
      : 0

    // Calculate MRR (simplified - would need Stripe integration for accurate data)
    // For now, use subscription counts and plan prices
    const { data: subscriptions } = await adminClient
      .from('profiles')
      .select('plan, billing_cycle')
      .eq('subscription_status', 'active')

    let mrr = 0
    const planPrices = {
      pro: { monthly: 99, annual: 79 },
      team: { monthly: 299, annual: 249 },
      enterprise: { monthly: 999, annual: 799 },
    }

    subscriptions?.forEach(sub => {
      const plan = sub.plan as keyof typeof planPrices
      if (planPrices[plan]) {
        const price = sub.billing_cycle === 'annual'
          ? planPrices[plan].annual
          : planPrices[plan].monthly
        mrr += price
      }
    })

    return NextResponse.json({
      totalUsers: totalUsersResult.count || 0,
      newUsersLast7Days: newUsersResult.count || 0,
      activeSubscriptions: activeSubscriptionsResult.count || 0,
      totalProjects: projectsResult.count || 0,
      pendingModeration: pendingModerationResult.count || 0,
      activeTrials: activeTrialsResult.count || 0,
      aiSuccessRate,
      avgConfidence,
      mrr,
    })
  } catch (error) {
    console.error('Overview analytics error:', error)
    return NextResponse.json({ error: 'Failed to fetch overview' }, { status: 500 })
  }
}
