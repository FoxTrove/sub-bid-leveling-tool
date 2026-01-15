import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { password } = await request.json()

    if (!password || password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Update the user's password
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    })

    if (updateError) {
      console.error("Password update error:", updateError)
      return NextResponse.json(
        { error: updateError.message || "Failed to set password" },
        { status: 400 }
      )
    }

    // Update profile to mark password as set
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ password_set: true })
      .eq("id", user.id)

    if (profileError) {
      console.error("Profile update error:", profileError)
      // Don't fail the request - password was set successfully
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Set password error:", error)
    return NextResponse.json(
      { error: "Failed to set password" },
      { status: 500 }
    )
  }
}
