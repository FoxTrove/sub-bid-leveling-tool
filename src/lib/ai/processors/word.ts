import type { WordTextPosition } from '@/types'

// ============================================
// Types for position-aware extraction
// ============================================

export interface WordParagraphWithPosition {
  text: string
  position: WordTextPosition
}

export interface WordExtractionResult {
  /** Full text content for AI processing */
  fullText: string
  /** Paragraphs with position metadata for document viewer highlighting */
  paragraphs: WordParagraphWithPosition[]
  /** Total paragraph count */
  paragraphCount: number
}

// ============================================
// Legacy extraction (backward compatible)
// ============================================

/**
 * Extract plain text from Word document (legacy method, backward compatible)
 */
export async function extractTextFromWord(buffer: Buffer): Promise<string> {
  try {
    // Dynamic import for CommonJS module compatibility with Turbopack
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mammothModule = await import("mammoth") as any
    const mammoth = mammothModule.default || mammothModule
    const result = await mammoth.extractRawText({ buffer })
    return result.value
  } catch (error) {
    console.error("Word extraction error:", error)
    throw new Error("Failed to extract text from Word document")
  }
}

// ============================================
// Position-aware extraction (new method)
// ============================================

/**
 * Extract text from Word document with paragraph position metadata for document viewer highlighting.
 */
export async function extractWordWithPositions(buffer: Buffer): Promise<WordExtractionResult> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mammothModule = await import("mammoth") as any
    const mammoth = mammothModule.default || mammothModule

    // Get raw text for AI processing
    const rawResult = await mammoth.extractRawText({ buffer })
    const fullText = rawResult.value

    // Split into paragraphs and track positions
    const paragraphs: WordParagraphWithPosition[] = []
    const textParagraphs = fullText.split(/\n+/)
    let charOffset = 0

    for (let i = 0; i < textParagraphs.length; i++) {
      const paragraphText = textParagraphs[i].trim()

      if (paragraphText.length > 0) {
        const paragraph: WordParagraphWithPosition = {
          text: paragraphText,
          position: {
            type: 'word',
            paragraph: i + 1, // 1-indexed
            charStart: charOffset,
            charEnd: charOffset + paragraphText.length,
          },
        }
        paragraphs.push(paragraph)
      }

      // Update offset (account for newlines)
      charOffset += textParagraphs[i].length + 1
    }

    return {
      fullText,
      paragraphs,
      paragraphCount: paragraphs.length,
    }
  } catch (error) {
    console.error("Word position extraction error:", error)
    // Fall back to legacy extraction
    const fallbackText = await extractTextFromWord(buffer)
    return {
      fullText: fallbackText,
      paragraphs: [],
      paragraphCount: 0,
    }
  }
}

// ============================================
// Utility functions
// ============================================

/**
 * Find paragraphs that match a given search string.
 * Used to match AI-extracted items back to their source paragraph positions.
 */
export function findMatchingParagraphs(
  paragraphs: WordParagraphWithPosition[],
  searchText: string,
  options: { fuzzyThreshold?: number; maxResults?: number } = {}
): WordParagraphWithPosition[] {
  const { fuzzyThreshold = 0.6, maxResults = 5 } = options

  if (!searchText || searchText.length < 3) {
    return []
  }

  const normalizedSearch = normalizeText(searchText)
  const matches: { paragraph: WordParagraphWithPosition; score: number }[] = []

  for (const paragraph of paragraphs) {
    const normalizedText = normalizeText(paragraph.text)
    const score = calculateSimilarity(normalizedText, normalizedSearch)

    if (score >= fuzzyThreshold) {
      matches.push({ paragraph, score })
    }
  }

  // Sort by score descending and take top results
  return matches
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map(m => m.paragraph)
}

/**
 * Find the paragraph containing a specific character offset.
 */
export function findParagraphAtOffset(
  paragraphs: WordParagraphWithPosition[],
  offset: number
): WordParagraphWithPosition | null {
  for (const paragraph of paragraphs) {
    if (offset >= paragraph.position.charStart && offset < paragraph.position.charEnd) {
      return paragraph
    }
  }
  return null
}

/**
 * Normalize text for comparison
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s.,-]/g, '')
    .trim()
}

/**
 * Calculate similarity between two strings
 */
function calculateSimilarity(text1: string, text2: string): number {
  if (!text1 || !text2) return 0
  if (text1 === text2) return 1

  // Containment check
  const shorter = text1.length < text2.length ? text1 : text2
  const longer = text1.length < text2.length ? text2 : text1

  if (longer.includes(shorter)) {
    return shorter.length / longer.length
  }

  // Word matching
  const words1 = new Set(text1.split(' ').filter(w => w.length > 2))
  const words2 = new Set(text2.split(' ').filter(w => w.length > 2))

  if (words1.size === 0 || words2.size === 0) return 0

  let matchCount = 0
  for (const word of words1) {
    if (words2.has(word)) matchCount++
  }

  return matchCount / Math.max(words1.size, words2.size)
}
