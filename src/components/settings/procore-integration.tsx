"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import { Loader2, CheckCircle2, ExternalLink, Unplug } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"

interface ProcoreIntegrationProps {
  isConnected: boolean
  companyName: string | null
  connectedAt: string | null
}

export function ProcoreIntegration({
  isConnected: initialIsConnected,
  companyName: initialCompanyName,
  connectedAt: initialConnectedAt,
}: ProcoreIntegrationProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isConnected, setIsConnected] = useState(initialIsConnected)
  const [companyName, setCompanyName] = useState(initialCompanyName)
  const [connectedAt, setConnectedAt] = useState(initialConnectedAt)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isDisconnecting, setIsDisconnecting] = useState(false)

  // Handle OAuth callback messages
  useEffect(() => {
    const procoreConnected = searchParams.get("procore_connected")
    const procoreError = searchParams.get("procore_error")

    if (procoreConnected === "true") {
      toast.success("Successfully connected to Procore!")
      // Clear the URL params
      router.replace("/settings")
      // Refresh to get updated state
      router.refresh()
    }

    if (procoreError) {
      const errorMessages: Record<string, string> = {
        missing_parameters: "Invalid callback - missing parameters",
        invalid_state: "Invalid state - please try again",
        unauthorized: "Session expired - please log in again",
        failed_to_get_user_info: "Failed to get your Procore account info",
        failed_to_get_companies: "Failed to get your Procore companies",
        no_companies: "No Procore companies found for your account",
        failed_to_save: "Failed to save the connection",
      }
      toast.error(errorMessages[procoreError] || procoreError)
      router.replace("/settings")
    }
  }, [searchParams, router])

  const handleConnect = async () => {
    setIsConnecting(true)

    try {
      const response = await fetch("/api/procore/auth/connect", {
        method: "POST",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to initiate connection")
      }

      const { authUrl } = await response.json()

      // Redirect to Procore OAuth
      window.location.href = authUrl
    } catch (error) {
      console.error("Connect error:", error)
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to connect to Procore"
      )
      setIsConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    if (
      !confirm(
        "Are you sure you want to disconnect Procore? You will need to reconnect to import projects."
      )
    ) {
      return
    }

    setIsDisconnecting(true)

    try {
      const response = await fetch("/api/procore/auth/disconnect", {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Failed to disconnect")
      }

      setIsConnected(false)
      setCompanyName(null)
      setConnectedAt(null)
      toast.success("Disconnected from Procore")
      router.refresh()
    } catch (error) {
      console.error("Disconnect error:", error)
      toast.error("Failed to disconnect from Procore")
    } finally {
      setIsDisconnecting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Image
            src="/procore-logo.png"
            alt="Procore"
            width={28}
            height={28}
            className="h-7 w-auto"
          />
          Procore Integration
        </CardTitle>
        <CardDescription>
          Connect your Procore account to import projects and bid packages
          directly into BidVet.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isConnected ? (
          <>
            <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                Connected to <strong>{companyName}</strong>
                {connectedAt && (
                  <span className="block text-sm text-green-600 dark:text-green-400">
                    Connected{" "}
                    {new Date(connectedAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                )}
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleDisconnect}
                disabled={isDisconnecting}
              >
                {isDisconnecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Disconnecting...
                  </>
                ) : (
                  <>
                    <Unplug className="mr-2 h-4 w-4" />
                    Disconnect
                  </>
                )}
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="rounded-lg border bg-muted/50 p-4 text-sm">
              <p className="font-medium mb-2">What you can do with Procore:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Import projects directly from your Procore account</li>
                <li>Pull bid packages and contractor bids automatically</li>
                <li>Skip manual file uploads for Procore-managed bids</li>
                <li>Keep your projects synced between systems</li>
              </ul>
            </div>

            <Button
              onClick={handleConnect}
              disabled={isConnecting}
              className="w-full sm:w-auto"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Connect to Procore
                </>
              )}
            </Button>

            <p className="text-xs text-muted-foreground">
              You&apos;ll be redirected to Procore to authorize BidVet.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  )
}
