"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import {
  Activity,
  FileText,
  MessageSquare,
  Share2,
  UserPlus,
  CheckCircle2,
  Loader2,
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface ActivityUser {
  id: string
  email: string
  full_name: string | null
}

interface ActivityProject {
  id: string
  name: string
}

interface TeamActivity {
  id: string
  activity_type: string
  metadata: Record<string, any> | null
  created_at: string
  user: ActivityUser | null
  project: ActivityProject | null
}

const activityIcons: Record<string, typeof Activity> = {
  project_created: FileText,
  project_shared: Share2,
  comment_added: MessageSquare,
  member_joined: UserPlus,
  analysis_completed: CheckCircle2,
}

const activityDescriptions: Record<string, (activity: TeamActivity) => string> = {
  project_created: (a) => `created a new project "${a.project?.name || "Untitled"}"`,
  project_shared: (a) => `shared "${a.project?.name || "a project"}"`,
  comment_added: (a) => `commented on "${a.project?.name || "a project"}"`,
  member_joined: () => "joined the team",
  analysis_completed: (a) => `completed analysis for "${a.project?.name || "a project"}"`,
}

interface TeamActivityFeedProps {
  className?: string
  limit?: number
  showHeader?: boolean
}

export function TeamActivityFeed({ className, limit = 10, showHeader = true }: TeamActivityFeedProps) {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activities, setActivities] = useState<TeamActivity[]>([])
  const [hasMore, setHasMore] = useState(false)
  const [offset, setOffset] = useState(0)

  const fetchActivities = useCallback(async (reset = false) => {
    const currentOffset = reset ? 0 : offset
    try {
      const response = await fetch(`/api/team/activity?limit=${limit}&offset=${currentOffset}`)
      if (response.ok) {
        const data = await response.json()
        if (reset) {
          setActivities(data.activities || [])
          setOffset(limit)
        } else {
          setActivities(prev => [...prev, ...(data.activities || [])])
          setOffset(prev => prev + limit)
        }
        setHasMore(data.hasMore || false)
      }
    } catch (error) {
      console.error("Error fetching activities:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [limit, offset])

  useEffect(() => {
    fetchActivities(true)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleRefresh = () => {
    setRefreshing(true)
    setOffset(0)
    fetchActivities(true)
  }

  const handleLoadMore = () => {
    fetchActivities(false)
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

  const getInitials = (user: ActivityUser | null) => {
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

  const getActivityDescription = (activity: TeamActivity) => {
    const descFn = activityDescriptions[activity.activity_type]
    return descFn ? descFn(activity) : activity.activity_type.replace(/_/g, " ")
  }

  const content = (
    <>
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : activities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Activity className="h-10 w-10 text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground">No team activity yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Activity will appear here as your team works on projects
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {activities.map((activity) => {
            const Icon = activityIcons[activity.activity_type] || Activity
            const userName = activity.user?.full_name || activity.user?.email || "Someone"

            return (
              <div
                key={activity.id}
                className="flex items-start gap-3 rounded-lg p-2 hover:bg-muted/50 transition-colors"
              >
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="text-xs">{getInitials(activity.user)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-medium">{userName}</span>{" "}
                    <span className="text-muted-foreground">
                      {getActivityDescription(activity)}
                    </span>
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Icon className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {getRelativeTime(activity.created_at)}
                    </span>
                  </div>
                </div>
                {activity.project && (
                  <Link
                    href={`/compare/${activity.project.id}`}
                    className="text-xs text-primary hover:underline shrink-0"
                  >
                    View
                  </Link>
                )}
              </div>
            )
          })}

          {hasMore && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-2"
              onClick={handleLoadMore}
            >
              Load more
            </Button>
          )}
        </div>
      )}
    </>
  )

  if (!showHeader) {
    return <div className={className}>{content}</div>
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Team Activity
            </CardTitle>
            <CardDescription className="text-xs">
              Recent activity from your team
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {content}
      </CardContent>
    </Card>
  )
}
