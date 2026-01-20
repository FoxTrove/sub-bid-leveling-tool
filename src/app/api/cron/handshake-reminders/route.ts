import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  sendHandshakeReminderEmail,
  sendHandshakeExpiredEmail,
} from '@/lib/email'
import { HANDSHAKE_FREE_PERIOD_DAYS } from '@/lib/utils/constants'

// This cron job runs daily to send HANDSHAKE reminder emails
// Schedule: Every day at 9am UTC (configured in vercel.json)

// Verify cron secret to prevent unauthorized access
const CRON_SECRET = process.env.CRON_SECRET

export async function GET(request: NextRequest) {
  // Verify authorization - CRON_SECRET is required
  const authHeader = request.headers.get('authorization')
  if (!CRON_SECRET) {
    console.error('CRON_SECRET not configured')
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Use service role for admin access
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const now = new Date()
  const results = {
    day7: { sent: 0, errors: 0 },
    day21: { sent: 0, errors: 0 },
    day27: { sent: 0, errors: 0 },
    expired: { sent: 0, errors: 0 },
  }

  try {
    // Get all HANDSHAKE users who need emails
    const { data: users, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, promo_code, promo_applied_at, openai_api_key_encrypted, handshake_reminder_day7_sent_at, handshake_reminder_day21_sent_at, handshake_reminder_day27_sent_at, handshake_expired_sent_at')
      .eq('promo_code', 'HANDSHAKE')
      .not('promo_applied_at', 'is', null)

    if (error) {
      console.error('Failed to fetch HANDSHAKE users:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (!users || users.length === 0) {
      return NextResponse.json({ message: 'No HANDSHAKE users to process', results })
    }

    for (const user of users) {
      const appliedAt = new Date(user.promo_applied_at)
      const daysSinceSignup = Math.floor(
        (now.getTime() - appliedAt.getTime()) / (1000 * 60 * 60 * 24)
      )
      const daysRemaining = Math.max(0, HANDSHAKE_FREE_PERIOD_DAYS - daysSinceSignup)
      const hasApiKey = !!user.openai_api_key_encrypted
      const firstName = user.full_name?.split(' ')[0] || 'there'

      // Skip users who already have an API key (they don't need reminders)
      if (hasApiKey) {
        continue
      }

      // Day 7 reminder (23 days remaining)
      if (daysSinceSignup >= 7 && daysSinceSignup < 21 && !user.handshake_reminder_day7_sent_at) {
        const result = await sendHandshakeReminderEmail({
          to: user.email,
          firstName,
          daysRemaining,
          reminderType: 'day7',
        })

        if (result.success) {
          await supabase
            .from('profiles')
            .update({ handshake_reminder_day7_sent_at: now.toISOString() })
            .eq('id', user.id)
          results.day7.sent++
        } else {
          results.day7.errors++
          console.error(`Failed to send day7 email to ${user.email}:`, result.error)
        }
      }

      // Day 21 reminder (9 days remaining)
      if (daysSinceSignup >= 21 && daysSinceSignup < 27 && !user.handshake_reminder_day21_sent_at) {
        const result = await sendHandshakeReminderEmail({
          to: user.email,
          firstName,
          daysRemaining,
          reminderType: 'day21',
        })

        if (result.success) {
          await supabase
            .from('profiles')
            .update({ handshake_reminder_day21_sent_at: now.toISOString() })
            .eq('id', user.id)
          results.day21.sent++
        } else {
          results.day21.errors++
          console.error(`Failed to send day21 email to ${user.email}:`, result.error)
        }
      }

      // Day 27 reminder (3 days remaining)
      if (daysSinceSignup >= 27 && daysSinceSignup < 30 && !user.handshake_reminder_day27_sent_at) {
        const result = await sendHandshakeReminderEmail({
          to: user.email,
          firstName,
          daysRemaining,
          reminderType: 'day27',
        })

        if (result.success) {
          await supabase
            .from('profiles')
            .update({ handshake_reminder_day27_sent_at: now.toISOString() })
            .eq('id', user.id)
          results.day27.sent++
        } else {
          results.day27.errors++
          console.error(`Failed to send day27 email to ${user.email}:`, result.error)
        }
      }

      // Expired email (after 30 days)
      if (daysSinceSignup >= 30 && !user.handshake_expired_sent_at) {
        const result = await sendHandshakeExpiredEmail({
          to: user.email,
          firstName,
        })

        if (result.success) {
          await supabase
            .from('profiles')
            .update({ handshake_expired_sent_at: now.toISOString() })
            .eq('id', user.id)
          results.expired.sent++
        } else {
          results.expired.errors++
          console.error(`Failed to send expired email to ${user.email}:`, result.error)
        }
      }
    }

    console.log('HANDSHAKE reminder cron completed:', results)
    return NextResponse.json({
      success: true,
      processed: users.length,
      results,
    })
  } catch (error) {
    console.error('HANDSHAKE reminder cron failed:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
