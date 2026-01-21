"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { DateRangePicker } from "@/components/admin/analytics/date-range-picker"
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface BusinessData {
  mrr: {
    total: number
    byPlan: {
      pro: number
      team: number
      enterprise: number
    }
  }
  subscriptions: {
    active: number
    newInPeriod: number
    canceledInPeriod: number
    distribution: {
      pro: number
      team: number
      enterprise: number
    }
  }
  conversion: {
    rate: number
    newUsers: number
    converted: number
    trialing: number
  }
  churn: {
    rate: number
    count: number
  }
  trends: Array<{
    date: string
    mrr_snapshot: number
    new_users: number
    active_subscriptions: number
  }>
}

function StatCard({
  title,
  value,
  subValue,
  icon: Icon,
  trend,
  trendValue,
  className,
}: {
  title: string
  value: string | number
  subValue?: string
  icon: React.ElementType
  trend?: "up" | "down" | "neutral"
  trendValue?: string
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
        <div className="flex items-center gap-2 mt-1">
          {trend && trend !== "neutral" && (
            <span className={cn(
              "flex items-center text-xs",
              trend === "up" ? "text-emerald-500" : "text-red-500"
            )}>
              {trend === "up" ? (
                <ArrowUpRight className="h-3 w-3 mr-1" />
              ) : (
                <ArrowDownRight className="h-3 w-3 mr-1" />
              )}
              {trendValue}
            </span>
          )}
          {subValue && (
            <span className="text-xs text-slate-500">{subValue}</span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function MRRBreakdown({ mrr }: { mrr: BusinessData['mrr'] }) {
  const plans = [
    { name: 'Pro', value: mrr.byPlan.pro, color: 'bg-blue-500' },
    { name: 'Team', value: mrr.byPlan.team, color: 'bg-purple-500' },
    { name: 'Enterprise', value: mrr.byPlan.enterprise, color: 'bg-amber-500' },
  ]

  const total = mrr.total || 1 // Avoid division by zero

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-lg text-slate-100">MRR Breakdown</CardTitle>
        <CardDescription className="text-slate-400">
          Revenue distribution by plan
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {plans.map((plan) => (
          <div key={plan.name}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-slate-300">{plan.name}</span>
              <span className="text-sm font-medium text-slate-100">
                ${plan.value.toLocaleString()}
              </span>
            </div>
            <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all", plan.color)}
                style={{ width: `${(plan.value / total) * 100}%` }}
              />
            </div>
          </div>
        ))}

        <div className="pt-4 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-400">Total MRR</span>
            <span className="text-xl font-bold text-slate-100">
              ${mrr.total.toLocaleString()}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ConversionFunnel({ conversion }: { conversion: BusinessData['conversion'] }) {
  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-lg text-slate-100">Conversion Funnel</CardTitle>
        <CardDescription className="text-slate-400">
          Trial to paid conversion
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
            <span className="text-sm text-slate-300">New Users</span>
            <span className="text-lg font-bold text-slate-100">{conversion.newUsers}</span>
          </div>
          <div className="flex justify-center">
            <TrendingDown className="h-5 w-5 text-slate-600" />
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
            <span className="text-sm text-slate-300">Currently Trialing</span>
            <span className="text-lg font-bold text-slate-100">{conversion.trialing}</span>
          </div>
          <div className="flex justify-center">
            <TrendingDown className="h-5 w-5 text-slate-600" />
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-900/20 border border-emerald-800/50">
            <span className="text-sm text-emerald-300">Converted to Paid</span>
            <span className="text-lg font-bold text-emerald-400">{conversion.converted}</span>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-400">Conversion Rate</span>
            <Badge
              variant="outline"
              className={cn(
                "text-lg",
                conversion.rate >= 0.1
                  ? "bg-emerald-900/20 text-emerald-400 border-emerald-800"
                  : "bg-amber-900/20 text-amber-400 border-amber-800"
              )}
            >
              {(conversion.rate * 100).toFixed(1)}%
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function BusinessAnalyticsPage() {
  const searchParams = useSearchParams()
  const period = searchParams.get('period') || '30'
  const [data, setData] = useState<BusinessData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const response = await fetch(`/api/admin/analytics/business?period=${period}`)
        if (response.ok) {
          const result = await response.json()
          setData(result)
        }
      } catch (error) {
        console.error("Failed to fetch business analytics:", error)
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
            <h1 className="text-2xl font-bold text-slate-100">Business Analytics</h1>
            <p className="text-slate-400 mt-1">MRR, churn, and conversion metrics</p>
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
        <h1 className="text-2xl font-bold text-slate-100">Business Analytics</h1>
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="py-8 text-center text-slate-400">
            Failed to load business analytics
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Business Analytics</h1>
          <p className="text-slate-400 mt-1">MRR, churn, and conversion metrics</p>
        </div>
        <DateRangePicker />
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Monthly Recurring Revenue"
          value={`$${data.mrr.total.toLocaleString()}`}
          icon={DollarSign}
          subValue={`${data.subscriptions.active} active subscriptions`}
        />
        <StatCard
          title="Active Subscriptions"
          value={data.subscriptions.active}
          icon={Users}
          trend={data.subscriptions.newInPeriod > 0 ? "up" : "neutral"}
          trendValue={`+${data.subscriptions.newInPeriod} new`}
        />
        <StatCard
          title="Conversion Rate"
          value={`${(data.conversion.rate * 100).toFixed(1)}%`}
          icon={TrendingUp}
          subValue={`${data.conversion.converted} of ${data.conversion.newUsers} users`}
        />
        <StatCard
          title="Churn Rate"
          value={`${(data.churn.rate * 100).toFixed(1)}%`}
          icon={TrendingDown}
          trend={data.churn.rate > 0.05 ? "down" : "up"}
          trendValue={`${data.churn.count} canceled`}
        />
      </div>

      {/* Detailed Views */}
      <div className="grid gap-6 lg:grid-cols-2">
        <MRRBreakdown mrr={data.mrr} />
        <ConversionFunnel conversion={data.conversion} />
      </div>

      {/* Plan Distribution */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-lg text-slate-100">Subscription Distribution</CardTitle>
          <CardDescription className="text-slate-400">
            Active subscriptions by plan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-blue-900/20 border border-blue-800/50 text-center">
              <p className="text-3xl font-bold text-blue-400">
                {data.subscriptions.distribution.pro}
              </p>
              <p className="text-sm text-blue-300 mt-1">Pro</p>
            </div>
            <div className="p-4 rounded-lg bg-purple-900/20 border border-purple-800/50 text-center">
              <p className="text-3xl font-bold text-purple-400">
                {data.subscriptions.distribution.team}
              </p>
              <p className="text-sm text-purple-300 mt-1">Team</p>
            </div>
            <div className="p-4 rounded-lg bg-amber-900/20 border border-amber-800/50 text-center">
              <p className="text-3xl font-bold text-amber-400">
                {data.subscriptions.distribution.enterprise}
              </p>
              <p className="text-sm text-amber-300 mt-1">Enterprise</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
