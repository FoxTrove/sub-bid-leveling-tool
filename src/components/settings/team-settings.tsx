"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import {
  Users,
  UserPlus,
  MoreVertical,
  Trash2,
  Shield,
  ShieldCheck,
  Crown,
  Mail,
  Loader2,
  Building2,
  X,
  Camera,
  ImageIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { toast } from "sonner"
import type { OrganizationRole } from "@/types"

interface TeamMember {
  id: string
  role: OrganizationRole
  joined_at: string
  user_id: string
  profiles: {
    id: string
    email: string
    full_name: string | null
    company_name: string | null
    last_active_at: string | null
  }
}

interface TeamInvite {
  id: string
  email: string
  role: OrganizationRole
  status: string
  expires_at: string
  created_at: string
}

interface Organization {
  id: string
  name: string
  slug: string
  max_members: number
  logo_url?: string | null
}

interface TeamSettingsProps {
  organization: Organization | null
  userRole: OrganizationRole | null
  currentUserId: string
}

const roleIcons: Record<OrganizationRole, typeof Crown> = {
  owner: Crown,
  admin: ShieldCheck,
  member: Shield,
}

const roleColors: Record<OrganizationRole, string> = {
  owner: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  admin: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  member: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
}

export function TeamSettings({ organization, userRole, currentUserId }: TeamSettingsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [members, setMembers] = useState<TeamMember[]>([])
  const [invites, setInvites] = useState<TeamInvite[]>([])
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<"admin" | "member">("member")
  const [inviting, setInviting] = useState(false)
  const [createOrgOpen, setCreateOrgOpen] = useState(false)
  const [orgName, setOrgName] = useState("")
  const [creating, setCreating] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string | null>(organization?.logo_url || null)
  const [uploadingLogo, setUploadingLogo] = useState(false)

  const isAdmin = userRole === "owner" || userRole === "admin"
  const isOwner = userRole === "owner"

  useEffect(() => {
    if (organization) {
      fetchTeamData()
    } else {
      setLoading(false)
    }
  }, [organization])

  const fetchTeamData = async () => {
    try {
      const response = await fetch("/api/team/members")
      if (response.ok) {
        const data = await response.json()
        setMembers(data.members || [])
        setInvites(data.invites || [])
      }
    } catch (error) {
      console.error("Error fetching team data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return

    setInviting(true)
    try {
      const response = await fetch("/api/team/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to send invite")
      }

      toast.success(`Invite sent to ${inviteEmail}`)
      setInviteEmail("")
      setInviteOpen(false)
      fetchTeamData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send invite")
    } finally {
      setInviting(false)
    }
  }

  const handleRevokeInvite = async (inviteId: string) => {
    try {
      const response = await fetch(`/api/team/invite?inviteId=${inviteId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to revoke invite")
      }

      toast.success("Invite revoked")
      fetchTeamData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to revoke invite")
    }
  }

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!confirm(`Are you sure you want to remove ${memberName} from the team?`)) {
      return
    }

    try {
      const response = await fetch(`/api/team/members?memberId=${memberId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to remove member")
      }

      toast.success(`${memberName} has been removed from the team`)
      fetchTeamData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to remove member")
    }
  }

  const handleUpdateRole = async (memberId: string, newRole: "admin" | "member") => {
    try {
      const response = await fetch("/api/team/members", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, role: newRole }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to update role")
      }

      toast.success("Role updated successfully")
      fetchTeamData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update role")
    }
  }

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadingLogo(true)
    try {
      const formData = new FormData()
      formData.append("logo", file)

      const response = await fetch("/api/team/logo", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload logo")
      }

      setLogoUrl(data.logo_url)
      toast.success("Team logo updated")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to upload logo")
    } finally {
      setUploadingLogo(false)
    }
  }

  const handleLogoRemove = async () => {
    if (!confirm("Are you sure you want to remove the team logo?")) return

    try {
      const response = await fetch("/api/team/logo", {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to remove logo")
      }

      setLogoUrl(null)
      toast.success("Team logo removed")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to remove logo")
    }
  }

  const handleCreateOrganization = async () => {
    if (!orgName.trim()) return

    setCreating(true)
    try {
      const response = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: orgName.trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create organization")
      }

      toast.success("Organization created!")
      setCreateOrgOpen(false)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create organization")
    } finally {
      setCreating(false)
    }
  }

  const getInitials = (member: TeamMember) => {
    const name = member.profiles.full_name || member.profiles.email
    return name
      .split(/[@.\s]/)
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const getLastActiveText = (lastActiveAt: string | null) => {
    if (!lastActiveAt) return "Never"

    const now = new Date()
    const lastActive = new Date(lastActiveAt)
    const diffMs = now.getTime() - lastActive.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 5) return "Active now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays === 1) return "Yesterday"
    if (diffDays < 7) return `${diffDays}d ago`
    return lastActive.toLocaleDateString()
  }

  const isActiveNow = (lastActiveAt: string | null) => {
    if (!lastActiveAt) return false
    const diffMs = new Date().getTime() - new Date(lastActiveAt).getTime()
    return diffMs < 5 * 60 * 1000 // Active in last 5 minutes
  }

  // No organization - show create option (only for team plan users)
  if (!organization) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team
          </CardTitle>
          <CardDescription>
            Create a team to collaborate with others
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">No team yet</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
              With a Team plan subscription, you can invite up to 10 team members
              to collaborate on bid comparisons.
            </p>
            <Dialog open={createOrgOpen} onOpenChange={setCreateOrgOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Building2 className="mr-2 h-4 w-4" />
                  Create Team
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create your team</DialogTitle>
                  <DialogDescription>
                    Give your team a name. You can change this later.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="org-name">Team name</Label>
                    <Input
                      id="org-name"
                      placeholder="Acme Construction"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateOrgOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateOrganization} disabled={creating || !orgName.trim()}>
                    {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Team
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {organization.name}
            </CardTitle>
            <CardDescription>
              {members.length} of {organization.max_members} team members
            </CardDescription>
          </div>
          {isAdmin && members.length < organization.max_members && (
            <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Invite
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite team member</DialogTitle>
                  <DialogDescription>
                    Send an invitation to join {organization.name}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="invite-email">Email address</Label>
                    <Input
                      id="invite-email"
                      type="email"
                      placeholder="colleague@company.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="invite-role">Role</Label>
                    <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as "admin" | "member")}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="member">Member - Can create and view comparisons</SelectItem>
                        <SelectItem value="admin">Admin - Can also invite and manage members</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setInviteOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleInvite} disabled={inviting || !inviteEmail.trim()}>
                    {inviting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Send Invite
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Team Logo */}
            {isAdmin && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground">Team Logo</h4>
                <div className="flex items-center gap-4">
                  <div className="relative group">
                    <div className="h-20 w-20 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center bg-muted/30 overflow-hidden">
                      {logoUrl ? (
                        <Image
                          src={logoUrl}
                          alt="Team logo"
                          width={80}
                          height={80}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                      )}
                    </div>
                    <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg cursor-pointer">
                      {uploadingLogo ? (
                        <Loader2 className="h-5 w-5 animate-spin text-white" />
                      ) : (
                        <Camera className="h-5 w-5 text-white" />
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleLogoUpload}
                        disabled={uploadingLogo}
                      />
                    </label>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">
                      Upload a logo for your team. It will appear in headers and exports.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Max 2MB. JPEG, PNG, GIF, WebP, or SVG.
                    </p>
                    {logoUrl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                        onClick={handleLogoRemove}
                      >
                        <Trash2 className="mr-1 h-3 w-3" />
                        Remove logo
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Members List */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">Members</h4>
              {members.map((member) => {
                const RoleIcon = roleIcons[member.role]
                const isCurrentUser = member.user_id === currentUserId
                const canManage = isAdmin && member.role !== "owner" && !isCurrentUser

                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>{getInitials(member)}</AvatarFallback>
                        </Avatar>
                        {isActiveNow(member.profiles.last_active_at) && (
                          <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">
                          {member.profiles.full_name || member.profiles.email}
                          {isCurrentUser && (
                            <span className="text-muted-foreground text-sm ml-2">(you)</span>
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {member.profiles.email}
                          <span className="mx-1.5">·</span>
                          <span className={isActiveNow(member.profiles.last_active_at) ? "text-green-600 dark:text-green-400" : ""}>
                            {getLastActiveText(member.profiles.last_active_at)}
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className={roleColors[member.role]}>
                        <RoleIcon className="mr-1 h-3 w-3" />
                        {member.role}
                      </Badge>
                      {canManage && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {isOwner && member.role === "member" && (
                              <DropdownMenuItem onClick={() => handleUpdateRole(member.id, "admin")}>
                                <ShieldCheck className="mr-2 h-4 w-4" />
                                Make Admin
                              </DropdownMenuItem>
                            )}
                            {isOwner && member.role === "admin" && (
                              <DropdownMenuItem onClick={() => handleUpdateRole(member.id, "member")}>
                                <Shield className="mr-2 h-4 w-4" />
                                Make Member
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() =>
                                handleRemoveMember(
                                  member.id,
                                  member.profiles.full_name || member.profiles.email
                                )
                              }
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Remove from team
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Pending Invites */}
            {invites.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground">Pending Invites</h4>
                {invites.map((invite) => (
                  <div
                    key={invite.id}
                    className="flex items-center justify-between rounded-lg border border-dashed p-3 bg-muted/30"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                        <Mail className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">{invite.email}</p>
                        <p className="text-sm text-muted-foreground">
                          Invited as {invite.role} · Expires{" "}
                          {new Date(invite.expires_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleRevokeInvite(invite.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Capacity Warning */}
            {members.length >= organization.max_members && (
              <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  Your team has reached its maximum capacity of {organization.max_members} members.
                  Upgrade to Enterprise for unlimited team members.
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
