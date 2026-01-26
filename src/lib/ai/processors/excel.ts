import * as XLSX from "xlsx"
import type { ExcelTextPosition } from '@/types'

// ============================================
// Types for position-aware extraction
// ============================================

export interface ExcelCellWithPosition {
  value: string
  position: ExcelTextPosition
}

export interface ExcelExtractionResult {
  /** Full text content for AI processing */
  fullText: string
  /** Cells with position metadata for document viewer highlighting */
  cells: ExcelCellWithPosition[]
  /** Sheet names in the workbook */
  sheetNames: string[]
  /** Primary sheet used for extraction */
  primarySheet: string
}

// ============================================
// Legacy extraction (backward compatible)
// ============================================

/**
 * Extract plain text from Excel (legacy method, backward compatible)
 */
export async function extractTextFromExcel(buffer: Buffer): Promise<string> {
  try {
    const workbook = XLSX.read(buffer, { type: "buffer" })

    // Find the most relevant sheet (look for bid-related names)
    const relevantSheetNames = ["bid", "pricing", "quote", "estimate", "proposal", "summary"]
    let targetSheet = workbook.SheetNames[0]

    for (const name of workbook.SheetNames) {
      const lowerName = name.toLowerCase()
      if (relevantSheetNames.some((term) => lowerName.includes(term))) {
        targetSheet = name
        break
      }
    }

    const worksheet = workbook.Sheets[targetSheet]

    // Convert to JSON for better structure understanding
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][]

    // Format as text that's easy for LLM to parse
    let text = `Sheet: ${targetSheet}\n\n`

    for (const row of jsonData) {
      if (Array.isArray(row) && row.some((cell) => cell !== null && cell !== undefined && cell !== "")) {
        text += row
          .map((cell) => {
            if (cell === null || cell === undefined) return ""
            return String(cell).trim()
          })
          .join(" | ")
        text += "\n"
      }
    }

    // Also include other sheets if they exist
    if (workbook.SheetNames.length > 1) {
      text += "\n\n--- Other Sheets ---\n"
      for (const sheetName of workbook.SheetNames) {
        if (sheetName === targetSheet) continue
        const sheet = workbook.Sheets[sheetName]
        const sheetJson = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][]

        // Only include if it has content
        if (sheetJson.length > 0) {
          text += `\nSheet: ${sheetName}\n`
          for (const row of sheetJson.slice(0, 50)) {
            // Limit rows from secondary sheets
            if (Array.isArray(row) && row.some((cell) => cell !== null && cell !== undefined && cell !== "")) {
              text += row
                .map((cell) => (cell != null ? String(cell).trim() : ""))
                .join(" | ")
              text += "\n"
            }
          }
        }
      }
    }

    return text
  } catch (error) {
    console.error("Excel extraction error:", error)
    throw new Error("Failed to extract text from Excel file")
  }
}

// ============================================
// Position-aware extraction (new method)
// ============================================

/**
 * Extract text from Excel with cell position metadata for document viewer highlighting.
 */
export async function extractExcelWithPositions(buffer: Buffer): Promise<ExcelExtractionResult> {
  try {
    const workbook = XLSX.read(buffer, { type: "buffer" })

    // Find the most relevant sheet
    const relevantSheetNames = ["bid", "pricing", "quote", "estimate", "proposal", "summary"]
    let primarySheet = workbook.SheetNames[0]

    for (const name of workbook.SheetNames) {
      const lowerName = name.toLowerCase()
      if (relevantSheetNames.some((term) => lowerName.includes(term))) {
        primarySheet = name
        break
      }
    }

    const cells: ExcelCellWithPosition[] = []
    const fullTextParts: string[] = []

    // Process all sheets
    for (const sheetName of workbook.SheetNames) {
      const worksheet = workbook.Sheets[sheetName]
      const isPrimary = sheetName === primarySheet

      // Get the range of the sheet
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')

      let sheetText = `Sheet: ${sheetName}\n\n`

      // Iterate through each cell
      for (let row = range.s.r; row <= range.e.r; row++) {
        const rowValues: string[] = []

        for (let col = range.s.c; col <= range.e.c; col++) {
          const cellRef = XLSX.utils.encode_cell({ r: row, c: col })
          const cell = worksheet[cellRef]

          if (cell && cell.v !== undefined && cell.v !== null && cell.v !== '') {
            const value = String(cell.v).trim()

            // Create position-aware cell
            const cellWithPosition: ExcelCellWithPosition = {
              value,
              position: {
                type: 'excel',
                sheet: sheetName,
                row: row + 1, // 1-indexed for display
                col: col + 1, // 1-indexed for display
                cellRef,
              },
            }

            cells.push(cellWithPosition)
            rowValues.push(value)
          } else {
            rowValues.push('')
          }
        }

        // Only add non-empty rows to text
        if (rowValues.some(v => v !== '')) {
          sheetText += rowValues.join(' | ') + '\n'
        }
      }

      // Add to full text (primary sheet first, then others with limits)
      if (isPrimary) {
        fullTextParts.unshift(sheetText)
      } else {
        // Limit secondary sheets
        const limitedSheetText = sheetText.split('\n').slice(0, 52).join('\n')
        fullTextParts.push('\n--- Other Sheet ---\n' + limitedSheetText)
      }
    }

    return {
      fullText: fullTextParts.join('\n'),
      cells,
      sheetNames: workbook.SheetNames,
      primarySheet,
    }
  } catch (error) {
    console.error("Excel position extraction error:", error)
    // Fall back to legacy extraction
    const fallbackText = await extractTextFromExcel(buffer)
    return {
      fullText: fallbackText,
      cells: [],
      sheetNames: [],
      primarySheet: 'Sheet1',
    }
  }
}

// ============================================
// Utility functions
// ============================================

/**
 * Find cells that match a given search string.
 * Used to match AI-extracted items back to their source cell positions.
 */
export function findMatchingCells(
  cells: ExcelCellWithPosition[],
  searchText: string,
  options: { fuzzyThreshold?: number; maxResults?: number; sheetFilter?: string } = {}
): ExcelCellWithPosition[] {
  const { fuzzyThreshold = 0.7, maxResults = 5, sheetFilter } = options

  if (!searchText || searchText.length < 2) {
    return []
  }

  const normalizedSearch = normalizeText(searchText)
  const matches: { cell: ExcelCellWithPosition; score: number }[] = []

  for (const cell of cells) {
    // Apply sheet filter if specified
    if (sheetFilter && cell.position.sheet !== sheetFilter) {
      continue
    }

    const normalizedValue = normalizeText(cell.value)
    const score = calculateSimilarity(normalizedValue, normalizedSearch)

    if (score >= fuzzyThreshold) {
      matches.push({ cell, score })
    }
  }

  // Sort by score descending and take top results
  return matches
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map(m => m.cell)
}

/**
 * Find cells in a specific row range that might contain related data.
 * Useful for finding all cells related to a line item.
 */
export function getCellsInRow(
  cells: ExcelCellWithPosition[],
  sheet: string,
  row: number
): ExcelCellWithPosition[] {
  return cells.filter(
    cell => cell.position.sheet === sheet && cell.position.row === row
  ).sort((a, b) => a.position.col - b.position.col)
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
  const words1 = new Set(text1.split(' ').filter(w => w.length > 1))
  const words2 = new Set(text2.split(' ').filter(w => w.length > 1))

  if (words1.size === 0 || words2.size === 0) return 0

  let matchCount = 0
  for (const word of words1) {
    if (words2.has(word)) matchCount++
  }

  return matchCount / Math.max(words1.size, words2.size)
}
