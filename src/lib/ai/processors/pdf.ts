import type { PdfTextPosition, TextBlockWithPosition } from '@/types'

// ============================================
// Types for position-aware extraction
// ============================================

export interface PdfTextBlockWithPosition {
  text: string
  position: PdfTextPosition
}

export interface PdfExtractionResult {
  /** Full text content for AI processing */
  fullText: string
  /** Text blocks with position metadata for document viewer highlighting */
  textBlocks: PdfTextBlockWithPosition[]
  /** Total number of pages */
  pageCount: number
}

// ============================================
// Legacy extraction (backward compatible)
// ============================================

/**
 * Extract plain text from PDF (legacy method, backward compatible)
 */
export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  try {
    // Dynamic import for CommonJS module compatibility with Turbopack
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfParseModule = await import("pdf-parse") as any
    const pdfParse = pdfParseModule.default || pdfParseModule
    const data = await pdfParse(buffer)
    return data.text
  } catch (error) {
    console.error("PDF extraction error:", error)
    throw new Error("Failed to extract text from PDF")
  }
}

// ============================================
// Position-aware extraction (new method)
// ============================================

/**
 * Extract text from PDF with position metadata for document viewer highlighting.
 * Uses pdfjs-dist for precise text positioning.
 */
export async function extractPdfWithPositions(buffer: Buffer): Promise<PdfExtractionResult> {
  try {
    // Dynamic import pdfjs-dist
    const pdfjsLib = await import('pdfjs-dist')

    // Set up the worker (required for pdfjs-dist)
    // In Node.js environment, we use the legacy build which doesn't require a worker
    const pdfDoc = await pdfjsLib.getDocument({
      data: new Uint8Array(buffer),
      useSystemFonts: true,
      disableFontFace: true,
    }).promise

    const textBlocks: PdfTextBlockWithPosition[] = []
    const fullTextParts: string[] = []
    const pageCount = pdfDoc.numPages

    // Process each page
    for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
      const page = await pdfDoc.getPage(pageNum)
      const textContent = await page.getTextContent()
      const viewport = page.getViewport({ scale: 1.0 })

      let pageText = ''

      for (const item of textContent.items) {
        // Type guard for TextItem (vs TextMarkedContent)
        if ('str' in item && item.str) {
          const text = item.str

          // Get transform matrix [a, b, c, d, e, f]
          // e = x position, f = y position from bottom
          const transform = item.transform
          const x = transform[4]
          // Convert from bottom-origin to top-origin coordinate system
          const y = viewport.height - transform[5]
          const width = item.width || text.length * 6 // Estimate if not available
          const height = item.height || 12 // Default font height estimate

          // Create position-aware text block
          const block: PdfTextBlockWithPosition = {
            text,
            position: {
              type: 'pdf',
              page: pageNum,
              x: Math.round(x * 100) / 100,
              y: Math.round(y * 100) / 100,
              width: Math.round(width * 100) / 100,
              height: Math.round(height * 100) / 100,
              fontName: item.fontName,
            },
          }

          textBlocks.push(block)
          pageText += text + ' '
        }
      }

      fullTextParts.push(pageText.trim())
    }

    return {
      fullText: fullTextParts.join('\n\n'),
      textBlocks,
      pageCount,
    }
  } catch (error) {
    console.error("PDF position extraction error:", error)
    // Fall back to legacy extraction if pdfjs-dist fails
    const fallbackText = await extractTextFromPdf(buffer)
    return {
      fullText: fallbackText,
      textBlocks: [],
      pageCount: 1,
    }
  }
}

// ============================================
// Utility functions
// ============================================

/**
 * Find text blocks that match a given search string (fuzzy matching).
 * Used to match AI-extracted items back to their source positions.
 */
export function findMatchingTextBlocks(
  textBlocks: PdfTextBlockWithPosition[],
  searchText: string,
  options: { fuzzyThreshold?: number; maxResults?: number } = {}
): PdfTextBlockWithPosition[] {
  const { fuzzyThreshold = 0.7, maxResults = 5 } = options

  if (!searchText || searchText.length < 3) {
    return []
  }

  const normalizedSearch = normalizeText(searchText)
  const matches: { block: PdfTextBlockWithPosition; score: number }[] = []

  // Build consecutive text strings from adjacent blocks
  for (let i = 0; i < textBlocks.length; i++) {
    // Try single block
    const singleScore = calculateSimilarity(
      normalizeText(textBlocks[i].text),
      normalizedSearch
    )
    if (singleScore >= fuzzyThreshold) {
      matches.push({ block: textBlocks[i], score: singleScore })
    }

    // Try combining with next 2-3 blocks (for multi-line text)
    let combinedText = textBlocks[i].text
    for (let j = i + 1; j < Math.min(i + 4, textBlocks.length); j++) {
      // Only combine blocks on the same page
      if (textBlocks[j].position.page !== textBlocks[i].position.page) break

      combinedText += ' ' + textBlocks[j].text
      const combinedScore = calculateSimilarity(
        normalizeText(combinedText),
        normalizedSearch
      )
      if (combinedScore >= fuzzyThreshold && combinedScore > singleScore) {
        // Return the first block's position for combined matches
        matches.push({ block: textBlocks[i], score: combinedScore })
        break
      }
    }
  }

  // Sort by score descending and take top results
  return matches
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map(m => m.block)
}

/**
 * Normalize text for comparison (lowercase, collapse whitespace)
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, '')
    .trim()
}

/**
 * Calculate similarity between two strings (0-1 score)
 * Uses a simple containment + length-based scoring
 */
function calculateSimilarity(text1: string, text2: string): number {
  if (!text1 || !text2) return 0

  // Exact match
  if (text1 === text2) return 1

  // Containment check
  const shorter = text1.length < text2.length ? text1 : text2
  const longer = text1.length < text2.length ? text2 : text1

  if (longer.includes(shorter)) {
    // Score based on how much of the longer string is matched
    return shorter.length / longer.length
  }

  // Partial word matching
  const words1 = new Set(text1.split(' ').filter(w => w.length > 2))
  const words2 = new Set(text2.split(' ').filter(w => w.length > 2))

  if (words1.size === 0 || words2.size === 0) return 0

  let matchCount = 0
  for (const word of words1) {
    if (words2.has(word)) matchCount++
  }

  return matchCount / Math.max(words1.size, words2.size)
}
