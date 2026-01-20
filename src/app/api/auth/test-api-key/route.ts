import { NextResponse } from "next/server"
import OpenAI from "openai"
import { rateLimiters } from "@/lib/utils/rate-limit"

export async function POST(request: Request) {
  // Rate limit by IP to prevent abuse
  const forwarded = request.headers.get("x-forwarded-for")
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown"

  const rateLimit = rateLimiters.apiKeyTest(ip)
  if (!rateLimit.success) {
    return NextResponse.json(
      { valid: false, error: "Too many requests. Please wait before trying again." },
      { status: 429 }
    )
  }

  try {
    const { apiKey } = await request.json()

    if (!apiKey || !apiKey.startsWith("sk-")) {
      return NextResponse.json(
        { valid: false, error: "Invalid API key format" },
        { status: 400 }
      )
    }

    // Test the API key by making a simple request
    const openai = new OpenAI({ apiKey })

    await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: "Hi" }],
      max_tokens: 5,
    })

    return NextResponse.json({ valid: true })
  } catch (error) {
    console.error("API key test error:", error)

    if (error instanceof OpenAI.AuthenticationError) {
      return NextResponse.json(
        { valid: false, error: "Invalid API key" },
        { status: 200 }
      )
    }

    if (error instanceof OpenAI.PermissionDeniedError) {
      return NextResponse.json(
        { valid: false, error: "API key does not have access to GPT-4o" },
        { status: 200 }
      )
    }

    return NextResponse.json(
      { valid: false, error: "Failed to test API key" },
      { status: 500 }
    )
  }
}
