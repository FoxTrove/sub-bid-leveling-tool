"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { RefreshCw, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface ReanalyzeButtonProps {
  projectId: string
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive"
  size?: "default" | "sm" | "lg" | "icon"
}

export function ReanalyzeButton({
  projectId,
  variant = "secondary",
  size = "default"
}: ReanalyzeButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleReanalyze = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/projects/${projectId}/analyze`, {
        method: "POST",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to start analysis")
      }

      // Refresh the page to show processing state
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start analysis")
      setIsLoading(false)
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant={variant} size={size} disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          {isLoading ? "Starting..." : "Re-run Analysis"}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Re-run Bid Analysis?</AlertDialogTitle>
          <AlertDialogDescription>
            This will re-process all bid documents and generate a new comparison.
            Any previous results will be replaced.
            <br /><br />
            This is useful if:
            <ul className="mt-2 list-disc pl-4 text-sm">
              <li>Some bids failed to extract properly</li>
              <li>You uploaded corrected files</li>
              <li>The AI service had temporary issues</li>
            </ul>
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleReanalyze} disabled={isLoading}>
            {isLoading ? "Starting..." : "Re-run Analysis"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
