import { createClient } from "@/lib/supabase/server"
import { NextResponse, NextRequest } from "next/server"
import {
  exchangeCodeForTokens,
  encryptTokens,
  ProcoreClient,
} from "@/lib/procore/client"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get("code")
    const state = searchParams.get("state")
    const error = searchParams.get("error")
    const errorDescription = searchParams.get("error_description")

    // Handle OAuth errors
    if (error) {
      console.error("Procore OAuth error:", error, errorDescription)
      return NextResponse.redirect(
        new URL(
          `/settings?procore_error=${encodeURIComponent(errorDescription || error)}`,
          request.url
        )
      )
    }

    // Verify required parameters
    if (!code || !state) {
      return NextResponse.redirect(
        new URL("/settings?procore_error=missing_parameters", request.url)
      )
    }

    // Decode and verify state
    let userId: string
    try {
      const decodedState = Buffer.from(state, "base64url").toString()
      const [, extractedUserId] = decodedState.split(":")
      if (!extractedUserId) {
        throw new Error("Invalid state format")
      }
      userId = extractedUserId
    } catch {
      return NextResponse.redirect(
        new URL("/settings?procore_error=invalid_state", request.url)
      )
    }

    // Verify the user is authenticated and matches
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user || user.id !== userId) {
      return NextResponse.redirect(
        new URL("/settings?procore_error=unauthorized", request.url)
      )
    }

    // Exchange authorization code for tokens
    const tokens = await exchangeCodeForTokens(code)

    // Encrypt tokens for storage
    const {
      accessTokenEncrypted,
      refreshTokenEncrypted,
      expiresAt,
    } = encryptTokens(tokens)

    // Get user info and companies from Procore
    // Note: We need to make an initial request without company ID to get /me
    const meResponse = await fetch("https://api.procore.com/rest/v1.0/me", {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    })

    if (!meResponse.ok) {
      console.error("Failed to get Procore user info")
      return NextResponse.redirect(
        new URL("/settings?procore_error=failed_to_get_user_info", request.url)
      )
    }

    const me = await meResponse.json()

    // Get the first company the user has access to
    // In a more complex implementation, you might let the user choose
    const companiesResponse = await fetch(
      "https://api.procore.com/rest/v1.0/companies",
      {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      }
    )

    if (!companiesResponse.ok) {
      console.error("Failed to get Procore companies")
      return NextResponse.redirect(
        new URL("/settings?procore_error=failed_to_get_companies", request.url)
      )
    }

    const companies = await companiesResponse.json()

    if (!companies || companies.length === 0) {
      return NextResponse.redirect(
        new URL("/settings?procore_error=no_companies", request.url)
      )
    }

    // Use the first active company
    const company = companies.find((c: { is_active: boolean }) => c.is_active) || companies[0]

    // Store the connection info in the user's profile
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        procore_access_token_encrypted: accessTokenEncrypted,
        procore_refresh_token_encrypted: refreshTokenEncrypted,
        procore_company_id: company.id.toString(),
        procore_company_name: company.name,
        procore_user_id: me.id.toString(),
        procore_token_expires_at: expiresAt.toISOString(),
        procore_connected_at: new Date().toISOString(),
      })
      .eq("id", user.id)

    if (updateError) {
      console.error("Failed to save Procore connection:", updateError)
      return NextResponse.redirect(
        new URL("/settings?procore_error=failed_to_save", request.url)
      )
    }

    // Redirect back to settings with success message
    return NextResponse.redirect(
      new URL("/settings?procore_connected=true", request.url)
    )
  } catch (error) {
    console.error("Procore callback error:", error)
    return NextResponse.redirect(
      new URL(
        `/settings?procore_error=${encodeURIComponent("Connection failed")}`,
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      )
    )
  }
}
