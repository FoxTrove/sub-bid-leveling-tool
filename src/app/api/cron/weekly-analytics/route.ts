import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  getWeeklyMetricsSummary,
  getLowConfidenceTrades,
  WeeklyMetricsSummary,
  TradeConfidenceStats,
} from '@/lib/analytics/queries'

// Admin emails to notify
const ADMIN_EMAILS = ['kyle@foxtrove.ai', 'admin@bidvet.com']

/**
 * GET /api/cron/weekly-analytics
 *
 * Weekly cron job to generate analytics report.
 * Should be called by Vercel Cron with CRON_SECRET header.
 *
 * To set up in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/weekly-analytics",
 *     "schedule": "0 9 * * 1"  // Every Monday at 9am UTC
 *   }]
 * }
 */
export async function GET(request: NextRequest) {
  // Verify cron secret for security
  const cronSecret = request.headers.get('authorization')
  const expectedSecret = process.env.CRON_SECRET

  // In production, verify the secret. Allow in development.
  if (process.env.NODE_ENV === 'production') {
    if (!expectedSecret) {
      console.error('CRON_SECRET not configured')
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
    }

    if (cronSecret !== `Bearer ${expectedSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  try {
    // Use service role client for full database access
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Fetch weekly metrics
    const summary = await getWeeklyMetricsSummary(supabase)
    const lowConfidenceTrades = await getLowConfidenceTrades(supabase, 0.7, 3, 7)

    // Build report
    const report = buildWeeklyReport(summary, lowConfidenceTrades)

    // Log the report (in production, this would be emailed)
    console.log('Weekly Analytics Report:')
    console.log(report)

    // Store report in database for admin dashboard access
    await supabase.from('analytics_reports').insert({
      report_type: 'weekly',
      report_data: summary,
      alerts: lowConfidenceTrades.map((t) => ({
        type: 'low_confidence',
        trade_type: t.trade_type,
        avg_confidence: t.avg_confidence,
        sample_count: t.total_runs,
      })),
      created_at: new Date().toISOString(),
    })

    // TODO: In production, send email to admins
    // await sendAdminEmail(ADMIN_EMAILS, 'Weekly Analytics Report', report)

    return NextResponse.json({
      success: true,
      summary: {
        period: `${summary.period_start} - ${summary.period_end}`,
        total_analyses: summary.total_analyses,
        success_rate: (summary.success_rate * 100).toFixed(1) + '%',
        avg_confidence: (summary.avg_confidence * 100).toFixed(1) + '%',
        alerts_count: lowConfidenceTrades.length,
      },
    })
  } catch (error) {
    console.error('Weekly analytics job failed:', error)
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    )
  }
}

function buildWeeklyReport(
  summary: WeeklyMetricsSummary,
  alerts: TradeConfidenceStats[]
): string {
  const lines: string[] = []

  lines.push('='.repeat(60))
  lines.push('BIDVET WEEKLY ANALYTICS REPORT')
  lines.push(`Period: ${new Date(summary.period_start).toLocaleDateString()} - ${new Date(summary.period_end).toLocaleDateString()}`)
  lines.push('='.repeat(60))
  lines.push('')

  lines.push('SUMMARY')
  lines.push('-'.repeat(40))
  lines.push(`Total Analyses: ${summary.total_analyses}`)
  lines.push(`Successful: ${summary.successful_analyses} (${(summary.success_rate * 100).toFixed(1)}%)`)
  lines.push(`Average Confidence: ${(summary.avg_confidence * 100).toFixed(1)}%`)
  lines.push(`Avg Extraction Time: ${(summary.avg_extraction_duration_ms / 1000).toFixed(2)}s`)
  lines.push(`Avg Normalization Time: ${(summary.avg_normalization_duration_ms / 1000).toFixed(2)}s`)
  lines.push(`Scope Gaps Identified: ${summary.total_scope_gaps}`)
  lines.push('')

  if (summary.trades_analyzed.length > 0) {
    lines.push('TRADES ANALYZED')
    lines.push('-'.repeat(40))
    for (const trade of summary.trades_analyzed.slice(0, 10)) {
      lines.push(`  ${trade.trade_type}: ${trade.count} analyses`)
    }
    lines.push('')
  }

  if (summary.confidence_by_trade.length > 0) {
    lines.push('CONFIDENCE BY TRADE')
    lines.push('-'.repeat(40))
    for (const trade of summary.confidence_by_trade) {
      const conf = (trade.avg_confidence * 100).toFixed(1)
      const indicator = trade.avg_confidence < 0.7 ? ' ⚠️' : ''
      lines.push(`  ${trade.trade_type}: ${conf}%${indicator}`)
    }
    lines.push('')
  }

  if (alerts.length > 0) {
    lines.push('⚠️  ALERTS - LOW CONFIDENCE TRADES')
    lines.push('-'.repeat(40))
    for (const alert of alerts) {
      lines.push(`  ${alert.trade_type}: ${(alert.avg_confidence * 100).toFixed(1)}% confidence (${alert.total_runs} analyses)`)
    }
    lines.push('')
    lines.push('ACTION NEEDED: Review prompts and correction patterns for these trades.')
    lines.push('')
  }

  lines.push('='.repeat(60))
  lines.push('Report generated by BidVet Analytics System')
  lines.push(`Generated at: ${new Date().toISOString()}`)

  return lines.join('\n')
}
