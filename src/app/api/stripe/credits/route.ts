import { createClient } from "@/lib/supabase/server"
import { stripe } from "@/lib/stripe/client"
import { CREDIT_PACKS, type CreditPackKey } from "@/lib/utils/constants"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    // Support both 'pack' and 'packKey' for flexibility
    const pack = (body.pack || body.packKey) as CreditPackKey

    if (!pack || !CREDIT_PACKS[pack]) {
      return NextResponse.json({ error: "Invalid credit pack" }, { status: 400 })
    }

    const creditPack = CREDIT_PACKS[pack]

    if (!creditPack.stripePriceId) {
      return NextResponse.json(
        { error: "Credit pack not configured. Please contact support." },
        { status: 500 }
      )
    }

    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get or create Stripe customer
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id, email, full_name, company_name")
      .eq("id", user.id)
      .single()

    let customerId = profile?.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email!,
        name: profile?.full_name || undefined,
        metadata: {
          supabase_user_id: user.id,
          company_name: profile?.company_name || "",
        },
      })

      customerId = customer.id

      await supabase
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", user.id)
    }

    // Create checkout session for one-time payment
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: creditPack.stripePriceId,
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/credits?success=true&pack=${pack}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/credits?canceled=true`,
      metadata: {
        supabase_user_id: user.id,
        credit_pack: pack,
        credits_amount: creditPack.estimatedComparisons.toString(),
      },
      payment_intent_data: {
        metadata: {
          supabase_user_id: user.id,
          credit_pack: pack,
          credits_amount: creditPack.estimatedComparisons.toString(),
        },
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error("Credit checkout error:", error)
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    )
  }
}
