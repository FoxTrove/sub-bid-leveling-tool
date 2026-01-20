import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { encrypt } from "@/lib/utils/encryption"
import { sendApiKeySuccessEmail } from "@/lib/email"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { apiKey } = await request.json()

    if (!apiKey || !apiKey.startsWith("sk-")) {
      return NextResponse.json(
        { error: "Invalid API key format" },
        { status: 400 }
      )
    }

    // Get user profile to check if this is a first-time key save
    const { data: profile } = await supabase
      .from("profiles")
      .select("email, full_name, promo_code, openai_api_key_encrypted, api_key_success_sent_at")
      .eq("id", user.id)
      .single()

    const isFirstKeySave = !profile?.openai_api_key_encrypted

    // Encrypt the API key before storing
    const encryptedKey = encrypt(apiKey)

    const { error } = await supabase
      .from("profiles")
      .update({ openai_api_key_encrypted: encryptedKey })
      .eq("id", user.id)

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json(
        { error: "Failed to save API key" },
        { status: 500 }
      )
    }

    // Send success email only on first key save and if not already sent
    if (profile && isFirstKeySave && !profile.api_key_success_sent_at) {
      const firstName = profile.full_name?.split(" ")[0] || "there"
      const isHandshakeUser = profile.promo_code === "HANDSHAKE"

      // Send email (fire and forget)
      sendApiKeySuccessEmail({
        to: profile.email,
        firstName,
        isHandshakeUser,
      })
        .then((result) => {
          if (result.success) {
            // Mark as sent
            supabase
              .from("profiles")
              .update({ api_key_success_sent_at: new Date().toISOString() })
              .eq("id", user.id)
              .then(() => {})
          }
        })
        .catch(console.error)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Save API key error:", error)
    return NextResponse.json(
      { error: "Failed to save API key" },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { error } = await supabase
      .from("profiles")
      .update({ openai_api_key_encrypted: null })
      .eq("id", user.id)

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json(
        { error: "Failed to remove API key" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Remove API key error:", error)
    return NextResponse.json(
      { error: "Failed to remove API key" },
      { status: 500 }
    )
  }
}
