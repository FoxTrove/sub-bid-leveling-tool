"use client"

import { useState } from "react"
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
import { UserCog, Loader2, ExternalLink } from "lucide-react"
import { toast } from "sonner"

interface ImpersonateButtonProps {
  userId: string
  userEmail: string
  userName?: string | null
}

export function ImpersonateButton({ userId, userEmail, userName }: ImpersonateButtonProps) {
  const [loading, setLoading] = useState(false)
  const [impersonationLink, setImpersonationLink] = useState<string | null>(null)

  const handleImpersonate = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/users/${userId}/impersonate`, {
        method: "POST",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create impersonation link")
      }

      const data = await response.json()
      setImpersonationLink(data.link)
      toast.success("Impersonation link generated")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to impersonate user")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const openImpersonationLink = () => {
    if (impersonationLink) {
      window.open(impersonationLink, "_blank")
      setImpersonationLink(null)
    }
  }

  if (impersonationLink) {
    return (
      <AlertDialog open={true} onOpenChange={() => setImpersonationLink(null)}>
        <AlertDialogContent className="bg-slate-900 border-slate-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-100">
              Impersonation Link Ready
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Click below to open a new tab signed in as{" "}
              <span className="font-medium text-slate-300">{userName || userEmail}</span>.
              <br />
              <br />
              The session will be clearly marked as an impersonation.
              Remember to sign out when done.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-700 text-slate-300 hover:bg-slate-800">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={openImpersonationLink}
              className="bg-amber-600 hover:bg-amber-700"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open as {userName || userEmail}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="border-amber-800 text-amber-400 hover:bg-amber-900/30"
        >
          <UserCog className="h-4 w-4 mr-2" />
          Impersonate
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="bg-slate-900 border-slate-800">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-slate-100">
            Impersonate User?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-slate-400">
            You are about to sign in as{" "}
            <span className="font-medium text-slate-300">{userName || userEmail}</span>.
            <br />
            <br />
            This will open a new browser tab with their session. All actions will be
            logged for audit purposes.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="border-slate-700 text-slate-300 hover:bg-slate-800">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleImpersonate}
            disabled={loading}
            className="bg-amber-600 hover:bg-amber-700"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <UserCog className="h-4 w-4 mr-2" />
                Generate Link
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
