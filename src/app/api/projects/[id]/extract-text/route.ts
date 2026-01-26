import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { extractTextFromPdf, extractPdfWithPositions } from '@/lib/ai/processors/pdf'
import { extractTextFromExcel } from '@/lib/ai/processors/excel'
import { extractTextFromWord } from '@/lib/ai/processors/word'

/**
 * POST /api/projects/[id]/extract-text
 *
 * Extracts raw text from all uploaded bid documents in a project.
 * This is a lightweight operation that runs BEFORE full AI analysis.
 * Used to generate breakdown options based on document content.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params

  const supabase = await createClient()

  // Verify user authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify project ownership
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id, user_id, status')
    .eq('id', projectId)
    .single()

  if (projectError || !project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  if (project.user_id !== user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  // Get all bid documents for this project
  const { data: documents, error: docsError } = await supabase
    .from('bid_documents')
    .select('id, file_name, file_url, file_type, raw_text')
    .eq('project_id', projectId)

  if (docsError || !documents || documents.length === 0) {
    return NextResponse.json(
      { error: 'No documents found for this project' },
      { status: 404 }
    )
  }

  const results: Array<{
    documentId: string
    fileName: string
    status: 'success' | 'error' | 'skipped'
    charCount?: number
    error?: string
  }> = []

  // Process each document
  for (const doc of documents) {
    // Skip if already has raw_text
    if (doc.raw_text && doc.raw_text.length > 0) {
      results.push({
        documentId: doc.id,
        fileName: doc.file_name,
        status: 'skipped',
        charCount: doc.raw_text.length,
      })
      continue
    }

    try {
      // Download the file
      const fileResponse = await fetch(doc.file_url)
      if (!fileResponse.ok) {
        throw new Error(`Failed to download file: ${fileResponse.status}`)
      }

      const fileBuffer = Buffer.from(await fileResponse.arrayBuffer())
      const fileExtension = doc.file_name.split('.').pop()?.toLowerCase()

      let extractedText = ''

      // Extract text based on file type
      switch (fileExtension) {
        case 'pdf': {
          // Use position-aware extraction for better results
          const pdfResult = await extractPdfWithPositions(fileBuffer)
          extractedText = pdfResult.fullText

          // Also save text positions for document viewer
          await supabase
            .from('bid_documents')
            .update({
              text_positions: {
                fileType: 'pdf',
                blocks: pdfResult.textBlocks,
                pageCount: pdfResult.pageCount,
              },
            })
            .eq('id', doc.id)
          break
        }

        case 'xlsx':
        case 'xls': {
          // Legacy extraction returns string directly
          extractedText = await extractTextFromExcel(fileBuffer)
          break
        }

        case 'docx':
        case 'doc': {
          // Legacy extraction returns string directly
          extractedText = await extractTextFromWord(fileBuffer)
          break
        }

        default:
          throw new Error(`Unsupported file type: ${fileExtension}`)
      }

      // Save extracted text to database
      await supabase
        .from('bid_documents')
        .update({
          raw_text: extractedText,
          upload_status: 'processed',
        })
        .eq('id', doc.id)

      results.push({
        documentId: doc.id,
        fileName: doc.file_name,
        status: 'success',
        charCount: extractedText.length,
      })
    } catch (err) {
      console.error(`[ExtractText] Error processing ${doc.file_name}:`, err)

      // Update document status to error
      await supabase
        .from('bid_documents')
        .update({
          upload_status: 'error',
          error_message: err instanceof Error ? err.message : 'Unknown error',
        })
        .eq('id', doc.id)

      results.push({
        documentId: doc.id,
        fileName: doc.file_name,
        status: 'error',
        error: err instanceof Error ? err.message : 'Unknown error',
      })
    }
  }

  const successCount = results.filter((r) => r.status === 'success').length
  const skippedCount = results.filter((r) => r.status === 'skipped').length
  const errorCount = results.filter((r) => r.status === 'error').length

  return NextResponse.json({
    projectId,
    totalDocuments: documents.length,
    processed: successCount,
    skipped: skippedCount,
    errors: errorCount,
    results,
  })
}
