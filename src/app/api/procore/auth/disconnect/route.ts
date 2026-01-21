import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Clear all Procore-related fields from the profile
    const { error } = await supabase
      .from("profiles")
      .update({
        procore_access_token_encrypted: null,
        procore_refresh_token_encrypted: null,
        procore_company_id: null,
        procore_company_name: null,
        procore_user_id: null,
        procore_token_expires_at: null,
        procore_connected_at: null,
      })
      .eq("id", user.id)

    if (error) {
      console.error("Failed to disconnect Procore:", error)
      return NextResponse.json(
        { error: "Failed to disconnect Procore" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Procore disconnect error:", error)
    return NextResponse.json(
      { error: "Failed to disconnect Procore" },
      { status: 500 }
    )
  }
}
