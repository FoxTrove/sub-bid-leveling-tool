import { Resend } from 'resend'
import { HandshakeWelcomeEmail } from './templates/handshake-welcome'
import { HandshakeReminderEmail } from './templates/handshake-reminder'
import { HandshakeExpiredEmail } from './templates/handshake-expired'
import { ApiKeySuccessEmail } from './templates/api-key-success'
import { SubscriptionWelcomeEmail } from './templates/subscription-welcome'
import { CreditPurchaseEmail } from './templates/credit-purchase'
import { SubscriptionCanceledEmail } from './templates/subscription-canceled'
import { PaymentFailedEmail } from './templates/payment-failed'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_EMAIL = process.env.NOTIFICATION_EMAIL || 'hello@foxtrove.ai'
const FROM_NAME = 'BidLevel'

export type EmailResult = {
  success: boolean
  error?: string
  id?: string
}

/**
 * Send welcome email when HANDSHAKE user completes onboarding
 */
export async function sendHandshakeWelcomeEmail(params: {
  to: string
  firstName: string
}): Promise<EmailResult> {
  try {
    const { data, error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: params.to,
      subject: 'Welcome to BidLevel - Your 30 days of free access starts now',
      react: HandshakeWelcomeEmail({ firstName: params.firstName }),
    })

    if (error) {
      console.error('Failed to send welcome email:', error)
      return { success: false, error: error.message }
    }

    return { success: true, id: data?.id }
  } catch (error) {
    console.error('Error sending welcome email:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Send reminder email at various points in the HANDSHAKE free period
 */
export async function sendHandshakeReminderEmail(params: {
  to: string
  firstName: string
  daysRemaining: number
  reminderType: 'day7' | 'day21' | 'day27'
}): Promise<EmailResult> {
  const subjects = {
    day7: "23 days left - How's BidLevel working for you?",
    day21: '9 days until you need your OpenAI key',
    day27: '3 days left - Add your API key to keep using BidLevel',
  }

  try {
    const { data, error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: params.to,
      subject: subjects[params.reminderType],
      react: HandshakeReminderEmail({
        firstName: params.firstName,
        daysRemaining: params.daysRemaining,
        reminderType: params.reminderType,
      }),
    })

    if (error) {
      console.error('Failed to send reminder email:', error)
      return { success: false, error: error.message }
    }

    return { success: true, id: data?.id }
  } catch (error) {
    console.error('Error sending reminder email:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Send email when HANDSHAKE free period has expired
 */
export async function sendHandshakeExpiredEmail(params: {
  to: string
  firstName: string
}): Promise<EmailResult> {
  try {
    const { data, error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: params.to,
      subject: 'Your free period ended - Add your API key to continue',
      react: HandshakeExpiredEmail({ firstName: params.firstName }),
    })

    if (error) {
      console.error('Failed to send expired email:', error)
      return { success: false, error: error.message }
    }

    return { success: true, id: data?.id }
  } catch (error) {
    console.error('Error sending expired email:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Send success email when user adds their API key
 */
export async function sendApiKeySuccessEmail(params: {
  to: string
  firstName: string
  isHandshakeUser: boolean
}): Promise<EmailResult> {
  try {
    const { data, error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: params.to,
      subject: "You're all set - Unlimited BidLevel access unlocked",
      react: ApiKeySuccessEmail({
        firstName: params.firstName,
        isHandshakeUser: params.isHandshakeUser,
      }),
    })

    if (error) {
      console.error('Failed to send API key success email:', error)
      return { success: false, error: error.message }
    }

    return { success: true, id: data?.id }
  } catch (error) {
    console.error('Error sending API key success email:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Send welcome email when user subscribes to a plan
 */
export async function sendSubscriptionWelcomeEmail(params: {
  to: string
  firstName: string
  planName: string
  billingCycle: 'monthly' | 'annual'
  amount: number
  nextBillingDate: string
}): Promise<EmailResult> {
  try {
    const { data, error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: params.to,
      subject: `Welcome to BidLevel ${params.planName} - You're all set!`,
      react: SubscriptionWelcomeEmail({
        firstName: params.firstName,
        planName: params.planName,
        billingCycle: params.billingCycle,
        amount: params.amount,
        nextBillingDate: params.nextBillingDate,
      }),
    })

    if (error) {
      console.error('Failed to send subscription welcome email:', error)
      return { success: false, error: error.message }
    }

    return { success: true, id: data?.id }
  } catch (error) {
    console.error('Error sending subscription welcome email:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Send confirmation email when user purchases credits
 */
export async function sendCreditPurchaseEmail(params: {
  to: string
  firstName: string
  packName: string
  creditsAmount: number
  amountPaid: number
  newBalance: number
}): Promise<EmailResult> {
  try {
    const { data, error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: params.to,
      subject: `Your ${params.packName} credit pack is ready - ${params.creditsAmount} comparisons added`,
      react: CreditPurchaseEmail({
        firstName: params.firstName,
        packName: params.packName,
        creditsAmount: params.creditsAmount,
        amountPaid: params.amountPaid,
        newBalance: params.newBalance,
      }),
    })

    if (error) {
      console.error('Failed to send credit purchase email:', error)
      return { success: false, error: error.message }
    }

    return { success: true, id: data?.id }
  } catch (error) {
    console.error('Error sending credit purchase email:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Send email when subscription is canceled
 */
export async function sendSubscriptionCanceledEmail(params: {
  to: string
  firstName: string
  planName: string
  accessEndsDate: string
}): Promise<EmailResult> {
  try {
    const { data, error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: params.to,
      subject: `Your BidLevel ${params.planName} subscription has been canceled`,
      react: SubscriptionCanceledEmail({
        firstName: params.firstName,
        planName: params.planName,
        accessEndsDate: params.accessEndsDate,
      }),
    })

    if (error) {
      console.error('Failed to send subscription canceled email:', error)
      return { success: false, error: error.message }
    }

    return { success: true, id: data?.id }
  } catch (error) {
    console.error('Error sending subscription canceled email:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Send email when a subscription payment fails
 */
export async function sendPaymentFailedEmail(params: {
  to: string
  firstName: string
  planName: string
  amount: number
  nextRetryDate?: string
}): Promise<EmailResult> {
  try {
    const { data, error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: params.to,
      subject: `Action required: Your BidLevel payment couldn't be processed`,
      react: PaymentFailedEmail({
        firstName: params.firstName,
        planName: params.planName,
        amount: params.amount,
        nextRetryDate: params.nextRetryDate,
      }),
    })

    if (error) {
      console.error('Failed to send payment failed email:', error)
      return { success: false, error: error.message }
    }

    return { success: true, id: data?.id }
  } catch (error) {
    console.error('Error sending payment failed email:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
