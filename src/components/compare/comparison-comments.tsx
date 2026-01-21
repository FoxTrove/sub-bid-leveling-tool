"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import {
  MessageSquare,
  Send,
  Loader2,
  MoreVertical,
  Trash2,
  AtSign,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface CommentUser {
  id: string
  email: string
  full_name: string | null
}

interface Comment {
  id: string
  content: string
  mentions: string[] | null
  parent_id: string | null
  created_at: string
  updated_at: string
  user: CommentUser | null
}

interface TeamMember {
  id: string
  email: string
  full_name: string | null
}

interface ComparisonCommentsProps {
  projectId: string
  currentUserId: string
  teamMembers?: TeamMember[]
}

export function ComparisonComments({
  projectId,
  currentUserId,
  teamMembers = [],
}: ComparisonCommentsProps) {
  const [loading, setLoading] = useState(true)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [showMentionPopover, setShowMentionPopover] = useState(false)
  const [mentionSearch, setMentionSearch] = useState("")
  const [mentionStartIndex, setMentionStartIndex] = useState<number | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const fetchComments = useCallback(async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/comments`)
      if (response.ok) {
        const data = await response.json()
        setComments(data.comments || [])
      }
    } catch (error) {
      console.error("Error fetching comments:", error)
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    fetchComments()
  }, [fetchComments])

  const handleSubmit = async () => {
    if (!newComment.trim()) return

    setSubmitting(true)
    try {
      const response = await fetch(`/api/projects/${projectId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to add comment")
      }

      const data = await response.json()
      setComments(prev => [...prev, data.comment])
      setNewComment("")
      toast.success("Comment added")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add comment")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (commentId: string) => {
    try {
      const response = await fetch(
        `/api/projects/${projectId}/comments?commentId=${commentId}`,
        { method: "DELETE" }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to delete comment")
      }

      setComments(prev => prev.filter(c => c.id !== commentId))
      toast.success("Comment deleted")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete comment")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSubmit()
    }

    // Handle @ mentions
    if (e.key === "@" && teamMembers.length > 0) {
      const target = e.target as HTMLTextAreaElement
      setMentionStartIndex(target.selectionStart)
      setShowMentionPopover(true)
      setMentionSearch("")
    }

    // Close mention popover on Escape
    if (e.key === "Escape" && showMentionPopover) {
      setShowMentionPopover(false)
      setMentionStartIndex(null)
    }
  }

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setNewComment(value)

    // Update mention search if we're in mention mode
    if (mentionStartIndex !== null && showMentionPopover) {
      const cursorPosition = e.target.selectionStart
      const textAfterAt = value.substring(mentionStartIndex + 1, cursorPosition)

      // If user typed a space or moved cursor, close the popover
      if (textAfterAt.includes(" ") || cursorPosition <= mentionStartIndex) {
        setShowMentionPopover(false)
        setMentionStartIndex(null)
      } else {
        setMentionSearch(textAfterAt)
      }
    }
  }

  const handleMentionSelect = (member: TeamMember) => {
    if (mentionStartIndex === null) return

    const beforeMention = newComment.substring(0, mentionStartIndex)
    const afterMention = newComment.substring(
      mentionStartIndex + 1 + mentionSearch.length
    )
    const displayName = member.full_name || member.email.split("@")[0]
    const mentionText = `@[${displayName}](${member.id})`

    setNewComment(`${beforeMention}${mentionText}${afterMention}`)
    setShowMentionPopover(false)
    setMentionStartIndex(null)

    // Focus back on textarea
    setTimeout(() => {
      textareaRef.current?.focus()
    }, 0)
  }

  const filteredMembers = teamMembers.filter((member) => {
    const name = member.full_name || member.email
    return name.toLowerCase().includes(mentionSearch.toLowerCase())
  })

  const getInitials = (user: CommentUser | null) => {
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

  const formatContent = (content: string) => {
    // Replace @[Name](id) with styled mentions
    return content.replace(
      /@\[([^\]]+)\]\(([^)]+)\)/g,
      '<span class="inline-flex items-center gap-0.5 rounded bg-primary/10 px-1 py-0.5 text-primary text-xs font-medium">@$1</span>'
    )
  }

  const getRelativeTime = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays === 1) return "Yesterday"
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Comments
          {comments.length > 0 && (
            <span className="text-xs font-normal text-muted-foreground">
              ({comments.length})
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Comments list */}
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-6">
            <MessageSquare className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No comments yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Be the first to add a comment
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-3 group">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="text-xs">
                    {getInitials(comment.user)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {comment.user?.full_name || comment.user?.email || "Unknown"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {getRelativeTime(comment.created_at)}
                    </span>
                    {comment.user?.id === currentUserId && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreVertical className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleDelete(comment.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                  <p
                    className="text-sm mt-1 whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ __html: formatContent(comment.content) }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* New comment input */}
        <div className="relative">
          <Textarea
            ref={textareaRef}
            placeholder={
              teamMembers.length > 0
                ? "Add a comment... Use @ to mention team members"
                : "Add a comment..."
            }
            value={newComment}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            className="min-h-[80px] pr-12 resize-none"
          />
          <Button
            size="icon"
            className="absolute bottom-2 right-2 h-8 w-8"
            onClick={handleSubmit}
            disabled={submitting || !newComment.trim()}
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>

          {/* Mention popover */}
          {showMentionPopover && filteredMembers.length > 0 && (
            <div className="absolute bottom-full left-0 mb-1 w-64 rounded-md border bg-popover p-1 shadow-md">
              <div className="text-xs text-muted-foreground px-2 py-1 flex items-center gap-1">
                <AtSign className="h-3 w-3" />
                Mention a team member
              </div>
              {filteredMembers.slice(0, 5).map((member) => (
                <button
                  key={member.id}
                  className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted transition-colors"
                  onClick={() => handleMentionSelect(member)}
                >
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">
                      {(member.full_name || member.email)
                        .split(/[@.\s]/)
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left">
                    <p className="font-medium">{member.full_name || member.email}</p>
                    {member.full_name && (
                      <p className="text-xs text-muted-foreground">{member.email}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          Press <kbd className="px-1 py-0.5 rounded bg-muted font-mono text-[10px]">Cmd</kbd>+
          <kbd className="px-1 py-0.5 rounded bg-muted font-mono text-[10px]">Enter</kbd> to send
        </p>
      </CardContent>
    </Card>
  )
}
