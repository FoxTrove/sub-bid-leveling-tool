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
