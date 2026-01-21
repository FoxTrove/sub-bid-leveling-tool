"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Users, Building2, CheckCircle2, XCircle, Loader2, Scale, FolderOpen, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"

interface InviteDetails {
  email: string
  role: string
  organization: {
    id: string
    name: string
  }
  expiresAt: string
}

interface UserContext {
  isLoggedIn: boolean
  email: string
  isEmailMatch: boolean
  hasExistingOrg: boolean
  existingOrgSame: boolean
  existingProjectCount: number
}

export default function InviteAcceptPage() {
  const router = useRouter()
  const params = useParams()
  const token = params.token as string

  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [invite, setInvite] = useState<InviteDetails | null>(null)
  const [userContext, setUserContext] = useState<UserContext | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [migratedCount, setMigratedCount] = useState(0)

  useEffect(() => {
    async function fetchInvite() {
      try {
        const response = await fetch(`/api/team/invite/accept?token=${token}`)
        const data = await response.json()

        if (!response.ok) {
          setError(data.error || "Failed to load invite")
          return
        }

        setInvite(data.invite)
        setUserContext(data.userContext)
      } catch {
        setError("Failed to load invite details")
      } finally {
        setLoading(false)
      }
    }

    fetchInvite()
  }, [token])

  const handleAccept = async () => {
    setAccepting(true)
    try {
      const response = await fetch("/api/team/invite/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          // User not logged in, redirect to login with return URL
          sessionStorage.setItem("bidvet_invite_token", token)
          router.push(`/login?redirect=/invite/${token}`)
          return
        }
        throw new Error(data.error || "Failed to accept invite")
      }

      setSuccess(true)
      setMigratedCount(data.migratedProjects || 0)
      toast.success(`Welcome to ${data.organization.name}!`)

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push("/dashboard")
      }, 2500)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to accept invite")
    } finally {
      setAccepting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-secondary/30">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading invite...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-secondary/30 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <XCircle className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle>Invalid Invite</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link href="/login">
              <Button variant="outline">Go to Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-secondary/30 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle>Welcome to the team!</CardTitle>
            <CardDescription>
              You've successfully joined {invite?.organization.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            {migratedCount > 0 && (
              <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3">
                <div className="flex items-center justify-center gap-2 text-blue-700 dark:text-blue-300">
                  <FolderOpen className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    {migratedCount} existing project{migratedCount !== 1 ? 's' : ''} added to team
                  </span>
                </div>
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              Redirecting to dashboard...
            </p>
            <Loader2 className="h-5 w-5 animate-spin mx-auto text-primary" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-secondary/30">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm">
        <div className="container flex h-16 items-center">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-lg blur-md group-hover:blur-lg transition-all" />
              <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80">
                <Scale className="h-5 w-5 text-primary-foreground" />
              </div>
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-xl font-bold text-gradient">BidVet</span>
              <span className="text-[10px] text-muted-foreground">by Foxtrove.ai</span>
            </div>
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">You're invited!</CardTitle>
            <CardDescription>
              Join {invite?.organization.name} on BidVet
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg bg-secondary/50 p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Organization</p>
                  <p className="font-medium">{invite?.organization.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Your role</p>
                  <p className="font-medium capitalize">{invite?.role}</p>
                </div>
              </div>
            </div>

            {/* User context warnings */}
            {userContext && !userContext.isEmailMatch && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  This invite was sent to <strong>{invite?.email}</strong>, but you're logged in as <strong>{userContext.email}</strong>.
                  Please log in with the correct email to accept this invite.
                </AlertDescription>
              </Alert>
            )}

            {userContext && userContext.hasExistingOrg && !userContext.existingOrgSame && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  You're already part of another organization. Please contact support to transfer to this team.
                </AlertDescription>
              </Alert>
            )}

            {/* Existing projects info */}
            {userContext && userContext.existingProjectCount > 0 && !userContext.hasExistingOrg && (
              <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3">
                <div className="flex items-start gap-3">
                  <FolderOpen className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-800 dark:text-blue-200">
                      Your {userContext.existingProjectCount} existing project{userContext.existingProjectCount !== 1 ? 's' : ''} will be added to the team
                    </p>
                    <p className="text-blue-600 dark:text-blue-400 mt-0.5">
                      All your bid comparisons will be shared with team members.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <p className="text-sm text-center text-muted-foreground">
              By accepting this invite, you'll be able to collaborate with your
              team on bid comparisons and share projects.
            </p>

            <Button
              className="w-full"
              size="lg"
              onClick={handleAccept}
              disabled={accepting || (userContext && !userContext.isEmailMatch) || (userContext?.hasExistingOrg && !userContext.existingOrgSame)}
            >
              {accepting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Accepting...
                </>
              ) : (
                "Accept Invitation"
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              This invite expires on{" "}
              {invite?.expiresAt
                ? new Date(invite.expiresAt).toLocaleDateString()
                : "soon"}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
