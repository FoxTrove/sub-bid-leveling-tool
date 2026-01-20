import { stripe } from "@/lib/stripe/client"
import { createAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import type Stripe from "stripe"
import {
  sendSubscriptionWelcomeEmail,
  sendCreditPurchaseEmail,
  sendSubscriptionCanceledEmail,
  sendPaymentFailedEmail,
} from "@/lib/email"

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

export async function POST(request: Request) {
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set")
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 })
  }

  const body = await request.text()
  const signature = request.headers.get("stripe-signature")

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error("Webhook signature verification failed:", err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Check for duplicate event (idempotency)
  const { data: existingEvent } = await supabase
    .from('webhook_events')
    .select('id')
    .eq('event_id', event.id)
    .single()

  if (existingEvent) {
    console.log(`Duplicate webhook event ${event.id}, skipping`)
    return NextResponse.json({ received: true, duplicate: true })
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutCompleted(supabase, session)
        break
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdate(supabase, subscription)
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(supabase, subscription)
        break
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentFailed(supabase, invoice)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    // Store event ID to prevent duplicate processing
    await supabase
      .from('webhook_events')
      .insert({
        event_id: event.id,
        event_type: event.type,
      })

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Webhook handler error:", error)
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 })
  }
}

async function handleCheckoutCompleted(
  supabase: ReturnType<typeof createAdminClient>,
  session: Stripe.Checkout.Session
) {
  // Handle credit pack purchase (one-time payment)
  if (session.mode === "payment" && session.metadata?.credit_pack) {
    const userId = session.metadata.supabase_user_id
    const creditsAmount = parseInt(session.metadata.credits_amount || "0", 10)
    const packName = session.metadata.credit_pack
    const amountPaid = session.amount_total ? session.amount_total / 100 : 0

    if (!userId || !creditsAmount) {
      console.error("Missing metadata for credit purchase:", session.metadata)
      return
    }

    // Use the add_credits function to atomically add credits
    const { data, error } = await supabase.rpc("add_credits", {
      p_user_id: userId,
      p_amount: creditsAmount,
      p_type: "purchase",
      p_description: `${packName} credit pack (${creditsAmount} credits)`,
      p_stripe_session_id: session.id,
    })

    if (error) {
      console.error("Failed to add credits:", error)
      throw error
    }

    console.log(`Added ${creditsAmount} credits for user ${userId}:`, data)

    // Send credit purchase email
    const { data: profile } = await supabase
      .from("profiles")
      .select("email, first_name, credits")
      .eq("id", userId)
      .single()

    if (profile?.email) {
      await sendCreditPurchaseEmail({
        to: profile.email,
        firstName: profile.first_name || "",
        packName,
        creditsAmount,
        amountPaid,
        newBalance: profile.credits || creditsAmount,
      })
      console.log(`Credit purchase email sent to ${profile.email}`)
    }
    return
  }

  // Handle subscription checkout
  if (session.subscription) {
    const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
    const userId = subscription.metadata.supabase_user_id
    const plan = subscription.metadata.plan || "Pro"

    if (!userId) {
      console.error("No user ID in subscription metadata")
      return
    }

    // Get billing info
    const priceId = subscription.items.data[0]?.price.id
    const price = await stripe.prices.retrieve(priceId)
    const billingCycle = price.recurring?.interval === "year" ? "annual" : "monthly"
    const amount = price.unit_amount ? price.unit_amount / 100 : 0
    const periodEnd = (subscription as unknown as { current_period_end: number }).current_period_end
    const nextBillingDate = periodEnd
      ? new Date(periodEnd * 1000).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : ""

    // Send subscription welcome email
    const { data: profile } = await supabase
      .from("profiles")
      .select("email, first_name")
      .eq("id", userId)
      .single()

    if (profile?.email) {
      await sendSubscriptionWelcomeEmail({
        to: profile.email,
        firstName: profile.first_name || "",
        planName: plan.charAt(0).toUpperCase() + plan.slice(1),
        billingCycle: billingCycle as "monthly" | "annual",
        amount,
        nextBillingDate,
      })
      console.log(`Subscription welcome email sent to ${profile.email}`)
    }

    console.log(`Subscription checkout completed for user ${userId}`)
  }
}

async function handleSubscriptionUpdate(
  supabase: ReturnType<typeof createAdminClient>,
  subscription: Stripe.Subscription
) {
  const userId = subscription.metadata.supabase_user_id
  const plan = subscription.metadata.plan as "pro" | "team" | undefined

  if (!userId) {
    console.error("No user ID in subscription metadata")
    return
  }

  // Determine billing cycle from price
  const priceId = subscription.items.data[0]?.price.id
  const price = await stripe.prices.retrieve(priceId)
  const billingCycle = price.recurring?.interval === "year" ? "annual" : "monthly"

  // Map Stripe status to our status
  let subscriptionStatus: "active" | "past_due" | "canceled" | "trialing" | "inactive"
  switch (subscription.status) {
    case "active":
      subscriptionStatus = "active"
      break
    case "past_due":
      subscriptionStatus = "past_due"
      break
    case "canceled":
    case "unpaid":
      subscriptionStatus = "canceled"
      break
    case "trialing":
      subscriptionStatus = "trialing"
      break
    default:
      subscriptionStatus = "inactive"
  }

  // Get period end (cast needed for newer Stripe SDK types)
  const periodEnd = (subscription as unknown as { current_period_end: number }).current_period_end

  const { error } = await supabase
    .from("profiles")
    .update({
      plan: plan || "pro",
      stripe_subscription_id: subscription.id,
      subscription_status: subscriptionStatus,
      subscription_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      billing_cycle: billingCycle,
    })
    .eq("id", userId)

  if (error) {
    console.error("Failed to update profile:", error)
    throw error
  }

  console.log(`Subscription updated for user ${userId}: ${plan} (${subscriptionStatus})`)
}

async function handleSubscriptionDeleted(
  supabase: ReturnType<typeof createAdminClient>,
  subscription: Stripe.Subscription
) {
  const userId = subscription.metadata.supabase_user_id
  const plan = subscription.metadata.plan || "Pro"

  if (!userId) {
    console.error("No user ID in subscription metadata")
    return
  }

  // Get the period end before cancellation takes effect
  const periodEnd = (subscription as unknown as { current_period_end: number }).current_period_end
  const accessEndsDate = periodEnd
    ? new Date(periodEnd * 1000).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })

  // Get user profile before updating
  const { data: profile } = await supabase
    .from("profiles")
    .select("email, first_name")
    .eq("id", userId)
    .single()

  const { error } = await supabase
    .from("profiles")
    .update({
      plan: "free",
      stripe_subscription_id: null,
      subscription_status: "canceled",
      subscription_period_end: null,
      billing_cycle: null,
    })
    .eq("id", userId)

  if (error) {
    console.error("Failed to update profile:", error)
    throw error
  }

  // Send subscription canceled email
  if (profile?.email) {
    await sendSubscriptionCanceledEmail({
      to: profile.email,
      firstName: profile.first_name || "",
      planName: plan.charAt(0).toUpperCase() + plan.slice(1),
      accessEndsDate,
    })
    console.log(`Subscription canceled email sent to ${profile.email}`)
  }

  console.log(`Subscription canceled for user ${userId}`)
}

async function handlePaymentFailed(
  supabase: ReturnType<typeof createAdminClient>,
  invoice: Stripe.Invoice
) {
  const customerId = invoice.customer as string
  const amount = invoice.amount_due ? invoice.amount_due / 100 : 0

  // Find user by Stripe customer ID
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, first_name, plan")
    .eq("stripe_customer_id", customerId)
    .single()

  if (!profile) {
    console.error("No profile found for customer:", customerId)
    return
  }

  await supabase
    .from("profiles")
    .update({ subscription_status: "past_due" })
    .eq("id", profile.id)

  // Calculate next retry date (Stripe typically retries after 3-5 days)
  const nextRetryDate = invoice.next_payment_attempt
    ? new Date(invoice.next_payment_attempt * 1000).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : undefined

  // Send payment failed email
  if (profile.email) {
    await sendPaymentFailedEmail({
      to: profile.email,
      firstName: profile.first_name || "",
      planName: profile.plan ? profile.plan.charAt(0).toUpperCase() + profile.plan.slice(1) : "Pro",
      amount,
      nextRetryDate,
    })
    console.log(`Payment failed email sent to ${profile.email}`)
  }

  console.log(`Payment failed for user ${profile.id}`)
}
