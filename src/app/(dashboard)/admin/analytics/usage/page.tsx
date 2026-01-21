"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { DateRangePicker } from "@/components/admin/analytics/date-range-picker"
import {
  FolderKanban,
  FileText,
  Users,
  Activity,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface UsageData {
  projects: {
    total: number
    newInPeriod: number
    completedInPeriod: number
    byStatus: Record<string, number>
  }
  documents: {
    total: number
    newInPeriod: number
    processedInPeriod: number
  }
  activeUsers: {
    daily: number
    weekly: number
    monthly: number
  }
  tradeTypes: Array<{ trade: string; count: number }>
  trends: Array<{
    date: string
    projects_created: number
    documents_processed: number
    active_users: number
  }>
}

function StatCard({
  title,
  value,
  subValue,
  icon: Icon,
  className,
}: {
  title: string
  value: string | number
  subValue?: string
  icon: React.ElementType
  className?: string
}) {
  return (
    <Card className={cn("bg-slate-900 border-slate-800", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-400">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-slate-500" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-slate-100">{value}</div>
        {subValue && (
          <p className="text-xs text-slate-500 mt-1">{subValue}</p>
        )}
      </CardContent>
    </Card>
  )
}

function ProjectStatusChart({ byStatus }: { byStatus: Record<string, number> }) {
  const statuses = [
    { key: 'complete', label: 'Complete', color: 'bg-emerald-500', icon: CheckCircle2 },
    { key: 'processing', label: 'Processing', color: 'bg-blue-500', icon: Activity },
    { key: 'draft', label: 'Draft', color: 'bg-slate-500', icon: Clock },
    { key: 'error', label: 'Error', color: 'bg-red-500', icon: AlertCircle },
  ]

  const total = Object.values(byStatus).reduce((sum, count) => sum + count, 0) || 1

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-lg text-slate-100">Projects by Status</CardTitle>
        <CardDescription className="text-slate-400">
          Distribution of project states
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {statuses.map(({ key, label, color, icon: StatusIcon }) => {
          const count = byStatus[key] || 0
          const percentage = (count / total) * 100

          return (
            <div key={key}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <StatusIcon className="h-4 w-4 text-slate-500" />
                  <span className="text-sm text-slate-300">{label}</span>
                </div>
                <span className="text-sm font-medium text-slate-100">
                  {count}
                </span>
              </div>
              <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all", color)}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

function TradeTypeChart({ tradeTypes }: { tradeTypes: Array<{ trade: string; count: number }> }) {
  const maxCount = Math.max(...tradeTypes.map(t => t.count), 1)

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-lg text-slate-100">Top Trade Types</CardTitle>
        <CardDescription className="text-slate-400">
          Most common project categories
        </CardDescription>
      </CardHeader>
      <CardContent>
        {tradeTypes.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">No data available</p>
        ) : (
          <div className="space-y-3">
            {tradeTypes.map(({ trade, count }, index) => (
              <div key={trade} className="flex items-center gap-3">
                <span className="text-xs text-slate-500 w-5">{index + 1}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-slate-300 truncate max-w-[150px]">
                      {trade}
                    </span>
                    <span className="text-sm font-medium text-slate-100">
                      {count}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-amber-500/70 transition-all"
                      style={{ width: `${(count / maxCount) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function ActiveUsersCard({ activeUsers }: { activeUsers: UsageData['activeUsers'] }) {
  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-lg text-slate-100">Active Users</CardTitle>
        <CardDescription className="text-slate-400">
          User engagement metrics
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 rounded-lg bg-slate-800/50">
            <p className="text-2xl font-bold text-emerald-400">{activeUsers.daily}</p>
            <p className="text-xs text-slate-500 mt-1">DAU</p>
            <p className="text-[10px] text-slate-600">Last 24h</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-slate-800/50">
            <p className="text-2xl font-bold text-blue-400">{activeUsers.weekly}</p>
            <p className="text-xs text-slate-500 mt-1">WAU</p>
            <p className="text-[10px] text-slate-600">Last 7 days</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-slate-800/50">
            <p className="text-2xl font-bold text-purple-400">{activeUsers.monthly}</p>
            <p className="text-xs text-slate-500 mt-1">MAU</p>
            <p className="text-[10px] text-slate-600">Last 30 days</p>
          </div>
        </div>

        {activeUsers.monthly > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">DAU/MAU Ratio</span>
              <Badge
                variant="outline"
                className={cn(
                  activeUsers.daily / activeUsers.monthly >= 0.2
                    ? "bg-emerald-900/20 text-emerald-400 border-emerald-800"
                    : "bg-amber-900/20 text-amber-400 border-amber-800"
                )}
              >
                {((activeUsers.daily / activeUsers.monthly) * 100).toFixed(1)}%
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function UsageAnalyticsPage() {
  const searchParams = useSearchParams()
  const period = searchParams.get('period') || '30'
  const [data, setData] = useState<UsageData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const response = await fetch(`/api/admin/analytics/usage?period=${period}`)
        if (response.ok) {
          const result = await response.json()
          setData(result)
        }
      } catch (error) {
        console.error("Failed to fetch usage analytics:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [period])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Usage Analytics</h1>
            <p className="text-slate-400 mt-1">Projects, documents, and user activity</p>
          </div>
          <Skeleton className="h-10 w-[180px] bg-slate-800" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 bg-slate-800" />
          ))}
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-100">Usage Analytics</h1>
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="py-8 text-center text-slate-400">
            Failed to load usage analytics
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Usage Analytics</h1>
          <p className="text-slate-400 mt-1">Projects, documents, and user activity</p>
        </div>
        <DateRangePicker />
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Projects"
          value={data.projects.total.toLocaleString()}
          subValue={`+${data.projects.newInPeriod} in period`}
          icon={FolderKanban}
        />
        <StatCard
          title="Comparisons Completed"
          value={data.projects.completedInPeriod.toLocaleString()}
          subValue="In selected period"
          icon={CheckCircle2}
        />
        <StatCard
          title="Documents Processed"
          value={data.documents.processedInPeriod.toLocaleString()}
          subValue={`${data.documents.total} total documents`}
          icon={FileText}
        />
        <StatCard
          title="Monthly Active Users"
          value={data.activeUsers.monthly}
          subValue={`${data.activeUsers.daily} active today`}
          icon={Users}
        />
      </div>

      {/* Detailed Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ProjectStatusChart byStatus={data.projects.byStatus} />
        <ActiveUsersCard activeUsers={data.activeUsers} />
      </div>

      <TradeTypeChart tradeTypes={data.tradeTypes} />
    </div>
  )
}
