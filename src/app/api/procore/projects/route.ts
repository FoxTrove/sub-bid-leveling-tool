import { createClient } from "@/lib/supabase/server"
import { NextResponse, NextRequest } from "next/server"
import { createProcoreClient } from "@/lib/procore/client"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's Procore credentials
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select(
        "procore_access_token_encrypted, procore_refresh_token_encrypted, procore_company_id, procore_token_expires_at"
      )
      .eq("id", user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      )
    }

    if (
      !profile.procore_access_token_encrypted ||
      !profile.procore_refresh_token_encrypted ||
      !profile.procore_company_id
    ) {
      return NextResponse.json(
        { error: "Procore is not connected" },
        { status: 400 }
      )
    }

    // Create Procore client with token refresh capability
    const client = await createProcoreClient(
      profile.procore_access_token_encrypted,
      profile.procore_refresh_token_encrypted,
      new Date(profile.procore_token_expires_at),
      profile.procore_company_id,
      async (newTokens) => {
        // Update the tokens in the database
        await supabase
          .from("profiles")
          .update({
            procore_access_token_encrypted: newTokens.accessTokenEncrypted,
            procore_refresh_token_encrypted: newTokens.refreshTokenEncrypted,
            procore_token_expires_at: newTokens.expiresAt.toISOString(),
          })
          .eq("id", user.id)
      }
    )

    // Get pagination parameters
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get("page") || "1", 10)
    const perPage = parseInt(searchParams.get("per_page") || "50", 10)
    const activeOnly = searchParams.get("active") !== "false"

    // Fetch projects from Procore
    const projects = await client.getProjects({
      page,
      perPage,
      filters: {
        active: activeOnly,
      },
    })

    return NextResponse.json({ projects })
  } catch (error) {
    console.error("Procore projects error:", error)

    // Check for specific error types
    if (error instanceof Error) {
      if (error.message.includes("401")) {
        return NextResponse.json(
          { error: "Procore authentication expired. Please reconnect." },
          { status: 401 }
        )
      }
    }

    return NextResponse.json(
      { error: "Failed to fetch Procore projects" },
      { status: 500 }
    )
  }
}
