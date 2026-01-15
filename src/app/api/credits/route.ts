import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get current credit balance
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("credit_balance, credits_purchased_total")
      .eq("id", user.id)
      .single()

    if (profileError) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    // Get recent transactions
    const { data: transactions, error: transactionsError } = await supabase
      .from("credit_transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20)

    if (transactionsError) {
      console.error("Error fetching transactions:", transactionsError)
    }

    return NextResponse.json({
      balance: profile.credit_balance || 0,
      totalPurchased: profile.credits_purchased_total || 0,
      transactions: transactions || [],
    })
  } catch (error) {
    console.error("Credits API error:", error)
    return NextResponse.json(
      { error: "Failed to fetch credit data" },
      { status: 500 }
    )
  }
}
