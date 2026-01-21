"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Users,
  DollarSign,
  FolderKanban,
  Brain,
  ClipboardCheck,
  Clock,
  TrendingUp,
  TrendingDown,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface KPIData {
  totalUsers: number
  newUsersLast7Days: number
  activeSubscriptions: number
  totalProjects: number
  pendingModeration: number
  activeTrials: number
  aiSuccessRate: number
  avgConfidence: number
  mrr: number
}

interface KPICardProps {
  title: string
  value: string | number
  description?: string
  icon: React.ElementType
  trend?: "up" | "down" | "neutral"
  trendValue?: string
  badge?: string
  badgeVariant?: "default" | "secondary" | "destructive" | "outline"
}

function KPICard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  trendValue,
  badge,
  badgeVariant = "secondary",
}: KPICardProps) {
  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-400">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-slate-500" />
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <div className="text-2xl font-bold text-slate-100">{value}</div>
          {badge && (
            <Badge variant={badgeVariant} className="text-xs">
              {badge}
            </Badge>
          )}
        </div>
        {(description || trend) && (
          <div className="flex items-center gap-1 mt-1">
            {trend && trend !== "neutral" && (
              <span className={cn(
                "flex items-center text-xs",
                trend === "up" ? "text-emerald-500" : "text-red-500"
              )}>
                {trend === "up" ? (
                  <TrendingUp className="h-3 w-3 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-1" />
                )}
                {trendValue}
              </span>
            )}
            {description && (
              <span className="text-xs text-slate-500">{description}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function KPICardSkeleton() {
  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-24 bg-slate-800" />
        <Skeleton className="h-4 w-4 bg-slate-800" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-16 bg-slate-800" />
        <Skeleton className="h-3 w-32 mt-2 bg-slate-800" />
      </CardContent>
    </Card>
  )
}

export function KPIGrid() {
  const [data, setData] = useState<KPIData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch("/api/admin/analytics/overview")
        if (!response.ok) {
          throw new Error("Failed to fetch overview data")
        }
        const data = await response.json()
        setData(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <KPICardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (error || !data) {
    return (
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="py-8 text-center text-slate-400">
          {error || "Failed to load overview data"}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <KPICard
        title="Total Users"
        value={data.totalUsers.toLocaleString()}
        description={`+${data.newUsersLast7Days} last 7 days`}
        icon={Users}
        trend={data.newUsersLast7Days > 0 ? "up" : "neutral"}
      />
      <KPICard
        title="Monthly Recurring Revenue"
        value={`$${data.mrr.toLocaleString()}`}
        description={`${data.activeSubscriptions} active subscriptions`}
        icon={DollarSign}
      />
      <KPICard
        title="Total Projects"
        value={data.totalProjects.toLocaleString()}
        icon={FolderKanban}
      />
      <KPICard
        title="AI Success Rate"
        value={`${(data.aiSuccessRate * 100).toFixed(1)}%`}
        description={`Avg confidence: ${(data.avgConfidence * 100).toFixed(1)}%`}
        icon={Brain}
        badge={data.aiSuccessRate >= 0.9 ? "Healthy" : data.aiSuccessRate >= 0.7 ? "OK" : "Needs Attention"}
        badgeVariant={data.aiSuccessRate >= 0.9 ? "default" : data.aiSuccessRate >= 0.7 ? "secondary" : "destructive"}
      />
      <KPICard
        title="Pending Moderation"
        value={data.pendingModeration}
        description="Training contributions to review"
        icon={ClipboardCheck}
        badge={data.pendingModeration > 10 ? "Needs Review" : undefined}
        badgeVariant="destructive"
      />
      <KPICard
        title="Active Trials"
        value={data.activeTrials}
        description="Users in 30-day trial period"
        icon={Clock}
      />
    </div>
  )
}
