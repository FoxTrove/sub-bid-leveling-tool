import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendSigninReminderEmail } from '@/lib/email'

// This cron job runs Mon/Wed/Fri to send sign-in reminders to users who
// created an account but haven't completed onboarding (no name in profile)
// Schedule: 10am UTC on Monday, Wednesday, Friday (configured in vercel.json)

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
    sent: 0,
    errors: 0,
    skipped: 0,
  }

  try {
    // Find users who:
    // 1. Have no full_name (haven't completed onboarding)
    // 2. Haven't been sent a signin reminder yet
    const { data: users, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, created_at, signin_reminder_sent_at')
      .is('full_name', null)
      .is('signin_reminder_sent_at', null)

    if (error) {
      console.error('Failed to fetch users for signin reminders:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (!users || users.length === 0) {
      return NextResponse.json({
        message: 'No users need signin reminders',
        results
      })
    }

    console.log(`Found ${users.length} users who need signin reminders`)

    for (const user of users) {
      // Skip if no email
      if (!user.email) {
        results.skipped++
        continue
      }

      const result = await sendSigninReminderEmail({
        to: user.email,
      })

      if (result.success) {
        // Mark that we sent the reminder
        await supabase
          .from('profiles')
          .update({ signin_reminder_sent_at: now.toISOString() })
          .eq('id', user.id)
        results.sent++
        console.log(`Sent signin reminder to ${user.email}`)
      } else {
        results.errors++
        console.error(`Failed to send signin reminder to ${user.email}:`, result.error)
      }
    }

    console.log('Signin reminder cron completed:', results)
    return NextResponse.json({
      success: true,
      processed: users.length,
      results,
    })
  } catch (error) {
    console.error('Signin reminder cron failed:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
