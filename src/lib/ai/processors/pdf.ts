export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  try {
    // Dynamic import for CommonJS module compatibility with Turbopack
    const pdfParse = (await import("pdf-parse")).default
    const data = await pdfParse(buffer)
    return data.text
  } catch (error) {
    console.error("PDF extraction error:", error)
    throw new Error("Failed to extract text from PDF")
  }
}
