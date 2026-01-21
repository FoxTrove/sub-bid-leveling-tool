"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertTriangle,
  Brain,
  CheckCircle2,
  TrendingDown,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface WeeklySummary {
  total_analyses: number
  successful_analyses: number
  success_rate: number
  avg_confidence: number
  avg_extraction_duration_ms: number
  total_scope_gaps: number
  trades_analyzed: { trade_type: string; count: number }[]
  confidence_by_trade: {
    trade_type: string
    total_runs: number
    avg_confidence: number
    low_confidence_rate: number
  }[]
  top_correction_patterns: {
    trade_type: string
    correction_type: string
    count: number
  }[]
}

interface Alert {
  type: string
  severity: string
  trade_type: string
  avg_confidence: number
  sample_count: number
  message: string
}

export default function AIQualityPage() {
  const [summary, setSummary] = useState<WeeklySummary | null>(null)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [summaryRes, alertsRes] = await Promise.all([
          fetch("/api/admin/analytics?type=summary"),
          fetch("/api/admin/analytics?type=alerts&threshold=0.7"),
        ])

        if (summaryRes.ok) {
          const data = await summaryRes.json()
          setSummary(data)
        }

        if (alertsRes.ok) {
          const data = await alertsRes.json()
          setAlerts(data.alerts || [])
        }
      } catch (error) {
        console.error("Failed to fetch AI metrics:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">AI Quality Metrics</h1>
          <p className="text-slate-400 mt-1">Pipeline performance and confidence tracking</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 bg-slate-800" />
          ))}
        </div>
      </div>
    )
  }

  if (!summary) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-100">AI Quality Metrics</h1>
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="py-8 text-center text-slate-400">
            No AI metrics data available yet
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">AI Quality Metrics</h1>
        <p className="text-slate-400 mt-1">Pipeline performance and confidence tracking</p>
      </div>

      {/* Alerts Banner */}
      {alerts.length > 0 && (
        <Card className="bg-amber-950/20 border-amber-800/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2 text-amber-400">
              <AlertTriangle className="h-5 w-5" />
              {alerts.length} Active Alert{alerts.length !== 1 ? "s" : ""}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.map((alert, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-amber-300/80">{alert.message}</span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "ml-2",
                      alert.severity === "critical" && "border-red-500 text-red-400",
                      alert.severity === "high" && "border-orange-500 text-orange-400",
                      alert.severity === "medium" && "border-yellow-500 text-yellow-400"
                    )}
                  >
                    {alert.severity}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-400">Total Analyses</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-slate-100">{summary.total_analyses}</p>
            <p className="text-xs text-slate-500">Last 7 days</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-400">Success Rate</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-emerald-400">
              {(summary.success_rate * 100).toFixed(1)}%
            </p>
            <p className="text-xs text-slate-500">
              {summary.successful_analyses} successful
            </p>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-400">Avg Confidence</CardDescription>
          </CardHeader>
          <CardContent>
            <p className={cn(
              "text-3xl font-bold",
              summary.avg_confidence >= 0.8 ? "text-emerald-400" :
              summary.avg_confidence >= 0.6 ? "text-yellow-400" : "text-red-400"
            )}>
              {(summary.avg_confidence * 100).toFixed(1)}%
            </p>
            <p className="text-xs text-slate-500">Extraction quality</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-400">Scope Gaps Found</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-slate-100">{summary.total_scope_gaps}</p>
            <p className="text-xs text-slate-500">Across all analyses</p>
          </CardContent>
        </Card>
      </div>

      {/* Confidence by Trade */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-100">
            <TrendingDown className="h-5 w-5" />
            Confidence by Trade Type
          </CardTitle>
          <CardDescription className="text-slate-400">
            Lowest confidence trades may need prompt improvements
          </CardDescription>
        </CardHeader>
        <CardContent>
          {summary.confidence_by_trade.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">No trade data available</p>
          ) : (
            <div className="space-y-3">
              {summary.confidence_by_trade.map((trade) => (
                <div key={trade.trade_type} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-slate-300">{trade.trade_type}</span>
                    <span className={cn(
                      trade.avg_confidence >= 0.8 ? "text-emerald-400" :
                      trade.avg_confidence >= 0.6 ? "text-yellow-400" : "text-red-400"
                    )}>
                      {(trade.avg_confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        trade.avg_confidence >= 0.8 ? "bg-emerald-500" :
                        trade.avg_confidence >= 0.6 ? "bg-yellow-500" : "bg-red-500"
                      )}
                      style={{ width: `${trade.avg_confidence * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-500">
                    {trade.total_runs} analyses, {(trade.low_confidence_rate * 100).toFixed(1)}% low confidence items
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Correction Patterns */}
      {summary.top_correction_patterns.length > 0 && (
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-slate-100">Top Correction Patterns</CardTitle>
            <CardDescription className="text-slate-400">
              Most common user corrections - consider updating prompts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {summary.top_correction_patterns.map((pattern, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                  <div>
                    <span className="font-medium text-slate-100">{pattern.trade_type}</span>
                    <span className="text-slate-500 mx-2">/</span>
                    <Badge variant="outline" className="text-slate-300 border-slate-600">
                      {pattern.correction_type}
                    </Badge>
                  </div>
                  <span className="font-mono text-sm text-slate-400">{pattern.count} corrections</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
