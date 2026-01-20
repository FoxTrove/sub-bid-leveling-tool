import { Resend } from 'resend'
import { HandshakeWelcomeEmail } from './templates/handshake-welcome'
import { HandshakeReminderEmail } from './templates/handshake-reminder'
import { HandshakeExpiredEmail } from './templates/handshake-expired'
import { ApiKeySuccessEmail } from './templates/api-key-success'
import { SubscriptionWelcomeEmail } from './templates/subscription-welcome'
import { CreditPurchaseEmail } from './templates/credit-purchase'
import { SubscriptionCanceledEmail } from './templates/subscription-canceled'
import { PaymentFailedEmail } from './templates/payment-failed'
import { TeamInviteEmail } from './templates/team-invite'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_EMAIL = process.env.NOTIFICATION_EMAIL || 'hello@foxtrove.ai'
const FROM_NAME = 'BidLevel'

// Retry configuration
const MAX_RETRIES = 3
const INITIAL_DELAY_MS = 1000 // 1 second

export type EmailResult = {
  success: boolean
  error?: string
  id?: string
  retries?: number
}

/**
 * Sleep for a given number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Send email with retry logic and exponential backoff
 */
async function sendWithRetry(
  sendFn: () => Promise<{ data: { id: string } | null; error: { message: string } | null }>
): Promise<EmailResult> {
  let lastError: string | undefined

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const { data, error } = await sendFn()

      if (!error && data) {
        return { success: true, id: data.id, retries: attempt }
      }

      lastError = error?.message || 'Unknown error'

      // Don't retry on certain errors
      if (error?.message?.includes('invalid') || error?.message?.includes('Invalid')) {
        break
      }

      // Wait before retrying (exponential backoff)
      if (attempt < MAX_RETRIES - 1) {
        const delay = INITIAL_DELAY_MS * Math.pow(2, attempt)
        console.log(`Email send failed, retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})`)
        await sleep(delay)
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Unknown error'

      if (attempt < MAX_RETRIES - 1) {
        const delay = INITIAL_DELAY_MS * Math.pow(2, attempt)
        await sleep(delay)
      }
    }
  }

  return { success: false, error: lastError }
}

/**
 * Send welcome email when HANDSHAKE user completes onboarding
 */
export async function sendHandshakeWelcomeEmail(params: {
  to: string
  firstName: string
}): Promise<EmailResult> {
  return sendWithRetry(() =>
    resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: params.to,
      subject: 'Welcome to BidLevel - Your 30 days of free access starts now',
      react: HandshakeWelcomeEmail({ firstName: params.firstName }),
    })
  )
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

  return sendWithRetry(() =>
    resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: params.to,
      subject: subjects[params.reminderType],
      react: HandshakeReminderEmail({
        firstName: params.firstName,
        daysRemaining: params.daysRemaining,
        reminderType: params.reminderType,
      }),
    })
  )
}

/**
 * Send email when HANDSHAKE free period has expired
 */
export async function sendHandshakeExpiredEmail(params: {
  to: string
  firstName: string
}): Promise<EmailResult> {
  return sendWithRetry(() =>
    resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: params.to,
      subject: 'Your free period ended - Add your API key to continue',
      react: HandshakeExpiredEmail({ firstName: params.firstName }),
    })
  )
}

/**
 * Send success email when user adds their API key
 */
export async function sendApiKeySuccessEmail(params: {
  to: string
  firstName: string
  isHandshakeUser: boolean
}): Promise<EmailResult> {
  return sendWithRetry(() =>
    resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: params.to,
      subject: "You're all set - Unlimited BidLevel access unlocked",
      react: ApiKeySuccessEmail({
        firstName: params.firstName,
        isHandshakeUser: params.isHandshakeUser,
      }),
    })
  )
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
  return sendWithRetry(() =>
    resend.emails.send({
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
  )
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
  return sendWithRetry(() =>
    resend.emails.send({
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
  )
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
  return sendWithRetry(() =>
    resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: params.to,
      subject: `Your BidLevel ${params.planName} subscription has been canceled`,
      react: SubscriptionCanceledEmail({
        firstName: params.firstName,
        planName: params.planName,
        accessEndsDate: params.accessEndsDate,
      }),
    })
  )
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
  return sendWithRetry(() =>
    resend.emails.send({
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
  )
}

/**
 * Send team invite email
 */
export async function sendTeamInviteEmail(
  to: string,
  organizationName: string,
  inviterName: string,
  inviteUrl: string
): Promise<EmailResult> {
  return sendWithRetry(() =>
    resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to,
      subject: `You've been invited to join ${organizationName} on BidLevel`,
      react: TeamInviteEmail({
        organizationName,
        inviterName,
        inviteUrl,
      }),
    })
  )
}
