import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { isAdminEmail } from '@/lib/admin/constants'

// Plan prices in cents
const PLAN_PRICES = {
  pro: { monthly: 9900, annual: 7900 },
  team: { monthly: 29900, annual: 24900 },
  enterprise: { monthly: 99900, annual: 79900 },
}

/**
 * GET /api/admin/analytics/business
 * Get business metrics: MRR, churn, conversions
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user?.email || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const searchParams = request.nextUrl.searchParams
  const period = searchParams.get('period') || '30' // days
  const periodDays = parseInt(period)

  const adminClient = createAdminClient()
  const startDate = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000).toISOString()

  try {
    // Get current subscriptions for MRR
    const { data: subscriptions } = await adminClient
      .from('profiles')
      .select('id, plan, billing_cycle, subscription_status, created_at')
      .eq('subscription_status', 'active')

    // Calculate current MRR
    let mrrCents = 0
    const mrrByPlan: Record<string, number> = { pro: 0, team: 0, enterprise: 0 }

    subscriptions?.forEach((sub) => {
      const plan = sub.plan as keyof typeof PLAN_PRICES
      if (PLAN_PRICES[plan]) {
        const price = sub.billing_cycle === 'annual'
          ? PLAN_PRICES[plan].annual
          : PLAN_PRICES[plan].monthly
        mrrCents += price
        mrrByPlan[plan] = (mrrByPlan[plan] || 0) + price
      }
    })

    // Get new subscriptions in period
    const { data: newSubs } = await adminClient
      .from('profiles')
      .select('id')
      .eq('subscription_status', 'active')
      .gte('created_at', startDate)

    // Get trial users (new users in period without active subscription)
    const { data: trialUsers, count: trialCount } = await adminClient
      .from('profiles')
      .select('id', { count: 'exact' })
      .gte('created_at', startDate)
      .neq('subscription_status', 'active')

    // Calculate conversion rate
    const { count: totalNewUsers } = await adminClient
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', startDate)

    const newSubsCount = newSubs?.length || 0
    const conversionRate = totalNewUsers && totalNewUsers > 0
      ? newSubsCount / totalNewUsers
      : 0

    // Get historical metrics for trend
    const { data: historicalMetrics } = await adminClient
      .from('admin_daily_metrics')
      .select('date, mrr_snapshot, new_users, active_subscriptions, new_subscriptions')
      .gte('date', startDate.split('T')[0])
      .order('date', { ascending: true })

    // Get canceled subscriptions (approximate - users with canceled status)
    const { count: canceledCount } = await adminClient
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('subscription_status', 'canceled')
      .gte('updated_at', startDate)

    // Calculate churn rate
    const prevActiveCount = subscriptions?.length || 0
    const churnRate = prevActiveCount > 0
      ? (canceledCount || 0) / (prevActiveCount + (canceledCount || 0))
      : 0

    // Get plan distribution
    const planDistribution = {
      pro: subscriptions?.filter(s => s.plan === 'pro').length || 0,
      team: subscriptions?.filter(s => s.plan === 'team').length || 0,
      enterprise: subscriptions?.filter(s => s.plan === 'enterprise').length || 0,
    }

    return NextResponse.json({
      mrr: {
        total: mrrCents / 100, // Convert to dollars
        byPlan: {
          pro: mrrByPlan.pro / 100,
          team: mrrByPlan.team / 100,
          enterprise: mrrByPlan.enterprise / 100,
        },
      },
      subscriptions: {
        active: subscriptions?.length || 0,
        newInPeriod: newSubsCount,
        canceledInPeriod: canceledCount || 0,
        distribution: planDistribution,
      },
      conversion: {
        rate: conversionRate,
        newUsers: totalNewUsers || 0,
        converted: newSubsCount,
        trialing: trialCount || 0,
      },
      churn: {
        rate: churnRate,
        count: canceledCount || 0,
      },
      trends: historicalMetrics || [],
    })
  } catch (error) {
    console.error('Business analytics error:', error)
    return NextResponse.json({ error: 'Failed to fetch business analytics' }, { status: 500 })
  }
}
