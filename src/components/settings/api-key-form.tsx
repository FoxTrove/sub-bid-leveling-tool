"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Key, Loader2, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"

interface ApiKeyFormProps {
  hasExistingKey: boolean
}

export function ApiKeyForm({ hasExistingKey }: ApiKeyFormProps) {
  const router = useRouter()
  const [apiKey, setApiKey] = useState("")
  const [showKey, setShowKey] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [isValid, setIsValid] = useState<boolean | null>(null)

  const handleTestKey = async () => {
    if (!apiKey.startsWith("sk-")) {
      toast.error("Invalid API key format. Key should start with 'sk-'")
      return
    }

    setIsTesting(true)
    setIsValid(null)

    try {
      const response = await fetch("/api/auth/test-api-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey }),
      })

      const data = await response.json()

      if (data.valid) {
        setIsValid(true)
        toast.success("API key is valid!")
      } else {
        setIsValid(false)
        toast.error(data.error || "Invalid API key")
      }
    } catch {
      setIsValid(false)
      toast.error("Failed to test API key")
    } finally {
      setIsTesting(false)
    }
  }

  const handleSaveKey = async () => {
    if (!apiKey.startsWith("sk-")) {
      toast.error("Invalid API key format")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/save-api-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey }),
      })

      if (!response.ok) {
        throw new Error("Failed to save API key")
      }

      toast.success("API key saved successfully")
      setApiKey("")
      router.refresh()
    } catch {
      toast.error("Failed to save API key")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveKey = async () => {
    if (!confirm("Are you sure you want to remove your API key?")) {
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/save-api-key", {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to remove API key")
      }

      toast.success("API key removed")
      router.refresh()
    } catch {
      toast.error("Failed to remove API key")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          OpenAI API Key
        </CardTitle>
        <CardDescription>
          {hasExistingKey
            ? "You have an API key configured. You can update or remove it below."
            : "Add your own OpenAI API key to continue using BidLevel after your trial ends."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasExistingKey && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              API key configured and active
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="apiKey">
            {hasExistingKey ? "New API Key (optional)" : "API Key"}
          </Label>
          <div className="relative">
            <Input
              id="apiKey"
              type={showKey ? "text" : "password"}
              placeholder="sk-..."
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value)
                setIsValid(null)
              }}
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full"
              onClick={() => setShowKey(!showKey)}
            >
              {showKey ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Get your API key from{" "}
            <a
              href="https://platform.openai.com/api-keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              OpenAI&apos;s dashboard
            </a>
          </p>
        </div>

        {isValid !== null && (
          <Alert variant={isValid ? "default" : "destructive"}>
            <AlertDescription>
              {isValid
                ? "API key is valid and working"
                : "API key is invalid or does not have access to GPT-4o"}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleTestKey}
            disabled={!apiKey || isTesting}
          >
            {isTesting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing...
              </>
            ) : (
              "Test Key"
            )}
          </Button>
          <Button onClick={handleSaveKey} disabled={!apiKey || isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Key"
            )}
          </Button>
          {hasExistingKey && (
            <Button
              variant="destructive"
              onClick={handleRemoveKey}
              disabled={isLoading}
            >
              Remove Key
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
