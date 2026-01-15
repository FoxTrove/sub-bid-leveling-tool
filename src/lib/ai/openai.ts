import OpenAI from "openai"
import { OPENAI_MODEL } from "@/lib/utils/constants"

// Create OpenAI client with provided API key
export function createOpenAIClient(apiKey: string) {
  return new OpenAI({ apiKey })
}

// Get API key to use - either user's own or app's
export function getApiKey(userApiKey: string | null): string {
  if (userApiKey) {
    return userApiKey
  }

  const appKey = process.env.OPENAI_API_KEY
  if (!appKey) {
    throw new Error("No OpenAI API key available")
  }

  return appKey
}

// Wrapper for chat completions with retry logic
export async function chatCompletion(
  client: OpenAI,
  messages: OpenAI.ChatCompletionMessageParam[],
  options?: {
    temperature?: number
    maxTokens?: number
    responseFormat?: "json_object" | "text"
  }
): Promise<string> {
  const { temperature = 0.1, maxTokens = 4096, responseFormat = "json_object" } = options || {}

  let retries = 3
  let lastError: Error | null = null

  while (retries > 0) {
    try {
      const response = await client.chat.completions.create({
        model: OPENAI_MODEL,
        messages,
        temperature,
        max_tokens: maxTokens,
        response_format: responseFormat === "json_object" ? { type: "json_object" } : undefined,
      })

      return response.choices[0]?.message?.content || ""
    } catch (error) {
      lastError = error as Error
      retries--

      if (retries > 0) {
        // Exponential backoff
        await new Promise((resolve) => setTimeout(resolve, (4 - retries) * 1000))
      }
    }
  }

  throw lastError || new Error("Failed to get completion")
}
