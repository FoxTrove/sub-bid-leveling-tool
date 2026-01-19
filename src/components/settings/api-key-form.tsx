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
import { trackApiKeyAdded, trackApiKeyRemoved } from "@/lib/analytics"

interface ApiKeyFormProps {
  hasExistingKey: boolean
  isHandshakeUser?: boolean
  handshakeDaysRemaining?: number
  handshakeFreePeriodExpired?: boolean
}

export function ApiKeyForm({
  hasExistingKey,
  isHandshakeUser = false,
  handshakeDaysRemaining = 0,
  handshakeFreePeriodExpired = false,
}: ApiKeyFormProps) {
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

      trackApiKeyAdded()
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

      trackApiKeyRemoved()
      toast.success("API key removed")
      router.refresh()
    } catch {
      toast.error("Failed to remove API key")
    } finally {
      setIsLoading(false)
    }
  }

  // Generate description based on user type and status
  const getDescription = () => {
    if (isHandshakeUser) {
      if (handshakeFreePeriodExpired) {
        return hasExistingKey
          ? "Your API key is active. You have unlimited access to BidLevel."
          : "Your 30-day free period has ended. Add your OpenAI API key to continue using BidLevel for free."
      }
      return hasExistingKey
        ? "You have an API key configured. You can update or remove it below."
        : `You have ${handshakeDaysRemaining} day${handshakeDaysRemaining !== 1 ? 's' : ''} remaining in your free period. Add your OpenAI API key before it ends to continue using BidLevel for free.`
    }
    return hasExistingKey
      ? "You have an API key configured. You can update or remove it below."
      : "Add your own OpenAI API key to continue using BidLevel after your trial ends."
  }

  return (
    <Card className={handshakeFreePeriodExpired && !hasExistingKey ? "border-amber-300 dark:border-amber-700" : ""}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          OpenAI API Key
          {isHandshakeUser && (
            <span className="ml-auto text-xs font-normal text-muted-foreground">
              HANDSHAKE Benefit
            </span>
          )}
        </CardTitle>
        <CardDescription>
          {getDescription()}
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

        {/* Step-by-step guide for getting an API key */}
        {!hasExistingKey && isHandshakeUser && (
          <div className="rounded-lg border bg-muted/50 p-4 text-sm">
            <p className="font-medium mb-2">How to get your OpenAI API key:</p>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>Go to <a href="https://platform.openai.com/signup" target="_blank" rel="noopener noreferrer" className="text-primary underline">platform.openai.com</a> and create an account</li>
              <li>Add a payment method (you'll only pay for what you use)</li>
              <li>Go to <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary underline">API Keys</a> and click "Create new secret key"</li>
              <li>Copy the key and paste it below</li>
            </ol>
            <p className="mt-2 text-xs text-muted-foreground">
              Typical cost: $1-3 per bid comparison depending on document size
            </p>
          </div>
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
          {!isHandshakeUser && (
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
          )}
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
