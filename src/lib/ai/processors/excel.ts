import * as XLSX from "xlsx"

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
