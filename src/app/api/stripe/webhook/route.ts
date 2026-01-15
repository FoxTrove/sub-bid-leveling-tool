import { stripe } from "@/lib/stripe/client"
import { createAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import type Stripe from "stripe"

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
  const userId = session.subscription
    ? (await stripe.subscriptions.retrieve(session.subscription as string)).metadata.supabase_user_id
    : null

  if (!userId) {
    console.error("No user ID in subscription metadata")
    return
  }

  // Subscription details will be updated via subscription.updated webhook
  console.log(`Checkout completed for user ${userId}`)
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

  if (!userId) {
    console.error("No user ID in subscription metadata")
    return
  }

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

  console.log(`Subscription canceled for user ${userId}`)
}

async function handlePaymentFailed(
  supabase: ReturnType<typeof createAdminClient>,
  invoice: Stripe.Invoice
) {
  const customerId = invoice.customer as string

  // Find user by Stripe customer ID
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
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

  console.log(`Payment failed for user ${profile.id}`)
}
