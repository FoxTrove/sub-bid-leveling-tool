import { createClient } from "@/lib/supabase/server"
import { NextResponse, NextRequest } from "next/server"
import { createProcoreClient } from "@/lib/procore/client"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params
    const procoreProjectId = parseInt(projectId, 10)

    if (isNaN(procoreProjectId)) {
      return NextResponse.json(
        { error: "Invalid project ID" },
        { status: 400 }
      )
    }

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

    // Create Procore client
    const client = await createProcoreClient(
      profile.procore_access_token_encrypted,
      profile.procore_refresh_token_encrypted,
      new Date(profile.procore_token_expires_at),
      profile.procore_company_id,
      async (newTokens) => {
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

    // Fetch bid packages from Procore
    const bidPackages = await client.getBidPackages(procoreProjectId)

    // For each bid package, fetch the bids
    const bidPackagesWithBids = await Promise.all(
      bidPackages.map(async (pkg) => {
        try {
          const bids = await client.getBids(procoreProjectId, pkg.id)
          return {
            ...pkg,
            bids,
            bidCount: bids.length,
          }
        } catch (error) {
          console.error(`Failed to fetch bids for package ${pkg.id}:`, error)
          return {
            ...pkg,
            bids: [],
            bidCount: 0,
          }
        }
      })
    )

    return NextResponse.json({ bidPackages: bidPackagesWithBids })
  } catch (error) {
    console.error("Procore bid packages error:", error)
    return NextResponse.json(
      { error: "Failed to fetch bid packages" },
      { status: 500 }
    )
  }
}
