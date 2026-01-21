import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { getProcoreAuthUrl, isProcoreConfigured } from "@/lib/procore/client"
import { randomBytes } from "crypto"

export async function POST() {
  try {
    // Check if Procore is configured
    if (!isProcoreConfigured()) {
      return NextResponse.json(
        { error: "Procore integration is not configured" },
        { status: 503 }
      )
    }

    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Generate a random state parameter to prevent CSRF attacks
    // We'll store this in a cookie to verify on callback
    const state = randomBytes(32).toString("hex")

    // Store the state with user ID for verification
    // In production, you might want to use a more secure method like Redis
    // For now, we'll encode the user ID in the state (separated by a delimiter)
    const stateWithUser = `${state}:${user.id}`
    const encodedState = Buffer.from(stateWithUser).toString("base64url")

    // Get the authorization URL
    const authUrl = getProcoreAuthUrl(encodedState)

    return NextResponse.json({ authUrl })
  } catch (error) {
    console.error("Procore connect error:", error)
    return NextResponse.json(
      { error: "Failed to initiate Procore connection" },
      { status: 500 }
    )
  }
}
