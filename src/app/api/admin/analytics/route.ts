import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import {
  getWeeklyMetricsSummary,
  getConfidenceByTrade,
  getCorrectionPatterns,
  getErrorRates,
  getLowConfidenceTrades,
} from '@/lib/analytics/queries'

// Admin email whitelist
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
 * GET /api/admin/analytics
 * Get analytics data based on type parameter
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient()

  if (!(await isAdmin(supabase))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const searchParams = request.nextUrl.searchParams
  const type = searchParams.get('type') || 'summary'
  const days = parseInt(searchParams.get('days') || '30')

  try {
    switch (type) {
      case 'summary':
      case 'weekly': {
        const summary = await getWeeklyMetricsSummary(supabase)
        return NextResponse.json(summary)
      }

      case 'confidence': {
        const confidenceStats = await getConfidenceByTrade(supabase, days)
        return NextResponse.json({ confidence_by_trade: confidenceStats })
      }

      case 'corrections': {
        const status = searchParams.get('status') as 'pending' | 'approved' | 'all' || 'approved'
        const corrections = await getCorrectionPatterns(supabase, status, days)
        return NextResponse.json({ correction_patterns: corrections })
      }

      case 'errors': {
        const errors = await getErrorRates(supabase, days)
        return NextResponse.json({ error_rates: errors })
      }

      case 'alerts': {
        const threshold = parseFloat(searchParams.get('threshold') || '0.7')
        const minSamples = parseInt(searchParams.get('min_samples') || '5')
        const lowConfTrades = await getLowConfidenceTrades(supabase, threshold, minSamples, days)
        return NextResponse.json({
          alerts: lowConfTrades.map((t) => ({
            type: 'low_confidence',
            severity: t.avg_confidence < 0.5 ? 'critical' : t.avg_confidence < 0.6 ? 'high' : 'medium',
            trade_type: t.trade_type,
            avg_confidence: t.avg_confidence,
            sample_count: t.total_runs,
            message: `${t.trade_type} trade has low average confidence (${(t.avg_confidence * 100).toFixed(1)}%) over ${t.total_runs} analyses`,
          })),
        })
      }

      default:
        return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 })
    }
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}
