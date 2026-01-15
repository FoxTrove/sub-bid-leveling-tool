import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { encrypt } from "@/lib/utils/encryption"

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
