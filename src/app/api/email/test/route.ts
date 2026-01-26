import { NextRequest, NextResponse } from 'next/server'
import {
  sendHandshakeWelcomeEmail,
  sendHandshakeReminderEmail,
  sendHandshakeExpiredEmail,
  sendApiKeySuccessEmail,
  sendSubscriptionWelcomeEmail,
  sendCreditPurchaseEmail,
  sendSubscriptionCanceledEmail,
  sendPaymentFailedEmail,
  sendSigninReminderEmail,
} from '@/lib/email'

// Test endpoint - only enabled in development
// Usage: POST /api/email/test?type=welcome&to=your@email.com

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Test endpoint disabled in production' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')
  const to = searchParams.get('to')

  if (!to) {
    return NextResponse.json({ error: 'Missing "to" parameter' }, { status: 400 })
  }

  if (!type) {
    return NextResponse.json({ error: 'Missing "type" parameter. Options: welcome, reminder-day7, reminder-day21, reminder-day27, expired, api-key-success, subscription-welcome, credit-purchase, subscription-canceled, payment-failed, signin-reminder' }, { status: 400 })
  }

  const firstName = 'Test User'

  let result

  switch (type) {
    case 'welcome':
      result = await sendHandshakeWelcomeEmail({ to, firstName })
      break

    case 'reminder-day7':
      result = await sendHandshakeReminderEmail({
        to,
        firstName,
        daysRemaining: 23,
        reminderType: 'day7',
      })
      break

    case 'reminder-day21':
      result = await sendHandshakeReminderEmail({
        to,
        firstName,
        daysRemaining: 9,
        reminderType: 'day21',
      })
      break

    case 'reminder-day27':
      result = await sendHandshakeReminderEmail({
        to,
        firstName,
        daysRemaining: 3,
        reminderType: 'day27',
      })
      break

    case 'expired':
      result = await sendHandshakeExpiredEmail({ to, firstName })
      break

    case 'api-key-success':
      result = await sendApiKeySuccessEmail({
        to,
        firstName,
        isHandshakeUser: true,
      })
      break

    case 'subscription-welcome':
      result = await sendSubscriptionWelcomeEmail({
        to,
        firstName,
        planName: 'Pro',
        billingCycle: 'monthly',
        amount: 99,
        nextBillingDate: 'February 20, 2026',
      })
      break

    case 'credit-purchase':
      result = await sendCreditPurchaseEmail({
        to,
        firstName,
        packName: 'Starter',
        creditsAmount: 10,
        amountPaid: 69,
        newBalance: 15,
      })
      break

    case 'subscription-canceled':
      result = await sendSubscriptionCanceledEmail({
        to,
        firstName,
        planName: 'Pro',
        accessEndsDate: 'February 20, 2026',
      })
      break

    case 'payment-failed':
      result = await sendPaymentFailedEmail({
        to,
        firstName,
        planName: 'Pro',
        amount: 99,
        nextRetryDate: 'January 25, 2026',
      })
      break

    case 'signin-reminder':
      result = await sendSigninReminderEmail({ to })
      break

    default:
      return NextResponse.json({
        error: `Unknown type "${type}". Options: welcome, reminder-day7, reminder-day21, reminder-day27, expired, api-key-success, subscription-welcome, credit-purchase, subscription-canceled, payment-failed, signin-reminder`,
      }, { status: 400 })
  }

  if (result.success) {
    return NextResponse.json({ success: true, type, to, id: result.id })
  } else {
    return NextResponse.json({ success: false, error: result.error }, { status: 500 })
  }
}

// Also support GET for easy browser testing
export async function GET(request: NextRequest) {
  return POST(request)
}
