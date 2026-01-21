import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// POST /api/team/logo - Upload team logo
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's organization and verify admin/owner role
    const { data: membership } = await supabase
      .from("organization_members")
      .select("organization_id, role")
      .eq("user_id", user.id)
      .single()

    if (!membership || !["owner", "admin"].includes(membership.role)) {
      return NextResponse.json(
        { error: "Only admins can update the team logo" },
        { status: 403 }
      )
    }

    const formData = await request.formData()
    const file = formData.get("logo") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"]
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload a JPEG, PNG, GIF, WebP, or SVG image." },
        { status: 400 }
      )
    }

    // Validate file size (max 2MB)
    const maxSize = 2 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 2MB." },
        { status: 400 }
      )
    }

    // Generate unique filename
    const fileExtension = file.name.split(".").pop() || "png"
    const fileName = `${membership.organization_id}/logo-${Date.now()}.${fileExtension}`

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("organization-logos")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: true,
      })

    if (uploadError) {
      console.error("Error uploading logo:", uploadError)
      return NextResponse.json({ error: "Failed to upload logo" }, { status: 500 })
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("organization-logos")
      .getPublicUrl(fileName)

    // Update organization with new logo URL
    const { error: updateError } = await supabase
      .from("organizations")
      .update({ logo_url: urlData.publicUrl })
      .eq("id", membership.organization_id)

    if (updateError) {
      console.error("Error updating organization logo:", updateError)
      return NextResponse.json({ error: "Failed to update organization" }, { status: 500 })
    }

    return NextResponse.json({ logo_url: urlData.publicUrl })
  } catch (error) {
    console.error("Logo upload error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/team/logo - Remove team logo
export async function DELETE() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's organization and verify admin/owner role
    const { data: membership } = await supabase
      .from("organization_members")
      .select("organization_id, role")
      .eq("user_id", user.id)
      .single()

    if (!membership || !["owner", "admin"].includes(membership.role)) {
      return NextResponse.json(
        { error: "Only admins can remove the team logo" },
        { status: 403 }
      )
    }

    // Get current logo URL
    const { data: org } = await supabase
      .from("organizations")
      .select("logo_url")
      .eq("id", membership.organization_id)
      .single()

    if (org?.logo_url) {
      // Extract file path from URL and delete from storage
      try {
        const url = new URL(org.logo_url)
        const pathMatch = url.pathname.match(/\/organization-logos\/(.+)$/)
        if (pathMatch) {
          await supabase.storage
            .from("organization-logos")
            .remove([pathMatch[1]])
        }
      } catch {
        // Ignore URL parsing errors
      }
    }

    // Remove logo URL from organization
    const { error: updateError } = await supabase
      .from("organizations")
      .update({ logo_url: null })
      .eq("id", membership.organization_id)

    if (updateError) {
      console.error("Error removing logo:", updateError)
      return NextResponse.json({ error: "Failed to remove logo" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Logo removal error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
