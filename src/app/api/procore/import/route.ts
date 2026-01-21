import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { createProcoreClient } from "@/lib/procore/client"
import { v4 as uuidv4 } from "uuid"

interface ImportRequest {
  procoreProjectId: number
  bidPackageId: number
  tradeType: string
  projectName?: string
  folderId?: string
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body: ImportRequest = await request.json()
    const { procoreProjectId, bidPackageId, tradeType, projectName, folderId } = body

    if (!procoreProjectId || !bidPackageId || !tradeType) {
      return NextResponse.json(
        { error: "Missing required fields: procoreProjectId, bidPackageId, tradeType" },
        { status: 400 }
      )
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

    // Fetch the Procore project details
    const procoreProject = await client.getProject(procoreProjectId)

    // Fetch the bid package
    const bidPackage = await client.getBidPackage(procoreProjectId, bidPackageId)

    // Fetch bids for this package
    const bids = await client.getBids(procoreProjectId, bidPackageId)

    if (bids.length < 2) {
      return NextResponse.json(
        { error: "At least 2 bids are required for comparison. This bid package only has " + bids.length + " bid(s)." },
        { status: 400 }
      )
    }

    // Create the BidVet project
    const projectId = uuidv4()
    const finalProjectName = projectName || `${procoreProject.name} - ${bidPackage.title}`

    const { error: projectError } = await supabase.from("projects").insert({
      id: projectId,
      user_id: user.id,
      name: finalProjectName,
      trade_type: tradeType,
      location: [procoreProject.city, procoreProject.state_code]
        .filter(Boolean)
        .join(", ") || null,
      folder_id: folderId || null,
      status: "uploading",
      procore_project_id: procoreProjectId.toString(),
      procore_project_name: procoreProject.name,
      source_system: "procore",
    })

    if (projectError) {
      console.error("Failed to create project:", projectError)
      return NextResponse.json(
        { error: "Failed to create project" },
        { status: 500 }
      )
    }

    // Process each bid and its attachments
    const importedDocuments: string[] = []
    const errors: string[] = []

    for (const bid of bids) {
      try {
        // Get full bid details with attachments
        const fullBid = await client.getBid(procoreProjectId, bidPackageId, bid.id)

        // Skip bids without attachments
        if (!fullBid.attachments || fullBid.attachments.length === 0) {
          // Create a placeholder document for bids without attachments
          // but with lump sum amounts
          if (fullBid.lump_sum_amount) {
            const docId = uuidv4()
            await supabase.from("bid_documents").insert({
              id: docId,
              project_id: projectId,
              contractor_name: fullBid.vendor?.name || `Vendor ${bid.vendor_id}`,
              file_name: `${fullBid.vendor?.name || 'Vendor'}_lump_sum.txt`,
              file_url: "", // No file, just lump sum data
              file_type: "text/plain",
              file_size: 0,
              upload_status: "uploaded",
              raw_text: `Lump Sum Bid: $${fullBid.lump_sum_amount.toLocaleString()}`,
              procore_bid_id: bid.id.toString(),
              procore_vendor_id: bid.vendor_id.toString(),
              source_system: "procore",
            })
            importedDocuments.push(fullBid.vendor?.name || `Vendor ${bid.vendor_id}`)
          }
          continue
        }

        // Process each attachment
        for (const attachment of fullBid.attachments) {
          try {
            // Download the attachment from Procore
            const fileData = await client.downloadAttachment(attachment.url)
            const fileBuffer = Buffer.from(fileData)

            // Upload to Supabase storage
            const storagePath = `${user.id}/${projectId}/${uuidv4()}_${attachment.name}`

            const { error: uploadError } = await supabase.storage
              .from("bid-documents")
              .upload(storagePath, fileBuffer, {
                contentType: attachment.content_type,
              })

            if (uploadError) {
              console.error("Storage upload error:", uploadError)
              errors.push(`Failed to upload ${attachment.name}`)
              continue
            }

            // Get the public URL
            const { data: urlData } = supabase.storage
              .from("bid-documents")
              .getPublicUrl(storagePath)

            // Create the bid_document record
            const docId = uuidv4()
            await supabase.from("bid_documents").insert({
              id: docId,
              project_id: projectId,
              contractor_name: fullBid.vendor?.name || `Vendor ${bid.vendor_id}`,
              file_name: attachment.name,
              file_url: urlData.publicUrl,
              file_type: attachment.content_type,
              file_size: attachment.file_size,
              upload_status: "uploaded",
              procore_bid_id: bid.id.toString(),
              procore_vendor_id: bid.vendor_id.toString(),
              source_system: "procore",
            })

            importedDocuments.push(`${fullBid.vendor?.name}: ${attachment.name}`)
          } catch (attachmentError) {
            console.error("Attachment processing error:", attachmentError)
            errors.push(`Failed to process ${attachment.name}`)
          }
        }
      } catch (bidError) {
        console.error("Bid processing error:", bidError)
        errors.push(`Failed to process bid from vendor ${bid.vendor_id}`)
      }
    }

    // Update project status
    if (importedDocuments.length >= 2) {
      await supabase
        .from("projects")
        .update({ status: "draft" })
        .eq("id", projectId)
    } else {
      // Not enough documents imported
      await supabase
        .from("projects")
        .update({
          status: "error",
          error_message: "Not enough bid documents could be imported. At least 2 are required.",
        })
        .eq("id", projectId)
    }

    return NextResponse.json({
      success: true,
      projectId,
      projectName: finalProjectName,
      documentsImported: importedDocuments.length,
      documents: importedDocuments,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error("Procore import error:", error)
    return NextResponse.json(
      { error: "Failed to import from Procore" },
      { status: 500 }
    )
  }
}
