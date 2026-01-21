"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Share2,
  UserPlus,
  X,
  Loader2,
  Eye,
  MessageSquare,
  Edit2,
  MoreVertical,
  Trash2,
  Link,
  Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

interface SharedUser {
  id: string
  email: string
  full_name: string | null
}

interface ProjectShare {
  id: string
  permission: "view" | "comment" | "edit"
  created_at: string
  shared_with: SharedUser | null
}

const permissionIcons: Record<string, typeof Eye> = {
  view: Eye,
  comment: MessageSquare,
  edit: Edit2,
}

const permissionLabels: Record<string, string> = {
  view: "Can view",
  comment: "Can comment",
  edit: "Can edit",
}

interface ProjectSharingProps {
  projectId: string
  projectName: string
  isOwner: boolean
}

export function ProjectSharing({ projectId, projectName, isOwner }: ProjectSharingProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [shares, setShares] = useState<ProjectShare[]>([])
  const [email, setEmail] = useState("")
  const [permission, setPermission] = useState<"view" | "comment" | "edit">("view")
  const [sharing, setSharing] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

  const fetchShares = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/projects/${projectId}/share`)
      if (response.ok) {
        const data = await response.json()
        setShares(data.shares || [])
      }
    } catch (error) {
      console.error("Error fetching shares:", error)
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    if (open) {
      fetchShares()
    }
  }, [open, fetchShares])

  const handleShare = async () => {
    if (!email.trim()) return

    setSharing(true)
    try {
      const response = await fetch(`/api/projects/${projectId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), permission }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to share project")
      }

      setShares(prev => [...prev, data.share])
      setEmail("")
      toast.success(`Project shared with ${email}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to share project")
    } finally {
      setSharing(false)
    }
  }

  const handleRemoveShare = async (shareId: string, userName: string) => {
    try {
      const response = await fetch(
        `/api/projects/${projectId}/share?shareId=${shareId}`,
        { method: "DELETE" }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to remove share")
      }

      setShares(prev => prev.filter(s => s.id !== shareId))
      toast.success(`Removed ${userName}'s access`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to remove share")
    }
  }

  const handleUpdatePermission = async (shareId: string, newPermission: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/share`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shareId, permission: newPermission }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to update permission")
      }

      setShares(prev =>
        prev.map(s =>
          s.id === shareId ? { ...s, permission: newPermission as "view" | "comment" | "edit" } : s
        )
      )
      toast.success("Permission updated")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update permission")
    }
  }

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/compare/${projectId}`
    await navigator.clipboard.writeText(url)
    setCopiedLink(true)
    toast.success("Link copied to clipboard")
    setTimeout(() => setCopiedLink(false), 2000)
  }

  const getInitials = (user: SharedUser | null) => {
    if (!user) return "?"
    const name = user.full_name || user.email
    return name
      .split(/[@.\s]/)
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  if (!isOwner) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Share2 className="h-4 w-4" />
          Share
          {shares.length > 0 && (
            <Badge variant="secondary" className="ml-1 px-1.5 py-0">
              {shares.length}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share project</DialogTitle>
          <DialogDescription>
            Share &quot;{projectName}&quot; with team members or external collaborators
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Add new share */}
          <div className="space-y-3">
            <Label htmlFor="share-email">Invite by email</Label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Input
                  id="share-email"
                  type="email"
                  placeholder="colleague@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleShare()
                    }
                  }}
                />
              </div>
              <Select value={permission} onValueChange={(v) => setPermission(v as "view" | "comment" | "edit")}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="view">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Can view
                    </div>
                  </SelectItem>
                  <SelectItem value="comment">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Can comment
                    </div>
                  </SelectItem>
                  <SelectItem value="edit">
                    <div className="flex items-center gap-2">
                      <Edit2 className="h-4 w-4" />
                      Can edit
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleShare} disabled={sharing || !email.trim()}>
                {sharing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Copy link */}
          <div className="flex items-center gap-2">
            <Input
              readOnly
              value={`${typeof window !== "undefined" ? window.location.origin : ""}/compare/${projectId}`}
              className="text-xs"
            />
            <Button variant="outline" size="icon" onClick={handleCopyLink}>
              {copiedLink ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Link className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Current shares */}
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : shares.length > 0 ? (
            <div className="space-y-2">
              <Label>People with access</Label>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {shares.map((share) => {
                  const PermIcon = permissionIcons[share.permission]
                  const userName = share.shared_with?.full_name || share.shared_with?.email || "Unknown"

                  return (
                    <div
                      key={share.id}
                      className="flex items-center justify-between rounded-lg border p-2"
                    >
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {getInitials(share.shared_with)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{userName}</p>
                          {share.shared_with?.full_name && (
                            <p className="text-xs text-muted-foreground">
                              {share.shared_with.email}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Select
                          value={share.permission}
                          onValueChange={(v) => handleUpdatePermission(share.id, v)}
                        >
                          <SelectTrigger className="h-8 w-[110px] text-xs">
                            <div className="flex items-center gap-1">
                              <PermIcon className="h-3 w-3" />
                              <span>{permissionLabels[share.permission]}</span>
                            </div>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="view">Can view</SelectItem>
                            <SelectItem value="comment">Can comment</SelectItem>
                            <SelectItem value="edit">Can edit</SelectItem>
                          </SelectContent>
                        </Select>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleRemoveShare(share.id, userName)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Remove access
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-sm text-muted-foreground">
              This project hasn&apos;t been shared with anyone yet
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
