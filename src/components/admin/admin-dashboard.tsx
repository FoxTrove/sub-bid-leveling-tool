"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  BarChart3,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Download,
  RefreshCw,
  TrendingDown,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface Contribution {
  id: string
  trade_type: string
  correction_type: string
  original_value: Record<string, unknown>
  corrected_value: Record<string, unknown>
  raw_text_snippet: string | null
  confidence_score_original: number | null
  moderation_status: string
  contributed_at: string
}

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
  message: string
}

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("analytics")
  const [summary, setSummary] = useState<WeeklySummary | null>(null)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [contributions, setContributions] = useState<Contribution[]>([])
  const [contributionsTotal, setContributionsTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [moderationStatus, setModerationStatus] = useState("pending")
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // Fetch analytics summary
  useEffect(() => {
    fetchSummary()
    fetchAlerts()
  }, [])

  // Fetch contributions when tab changes or status filter changes
  useEffect(() => {
    if (activeTab === "moderation") {
      fetchContributions()
    }
  }, [activeTab, moderationStatus])

  const fetchSummary = async () => {
    try {
      const response = await fetch("/api/admin/analytics?type=summary")
      if (response.ok) {
        const data = await response.json()
        setSummary(data)
      }
    } catch (error) {
      console.error("Failed to fetch summary:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAlerts = async () => {
    try {
      const response = await fetch("/api/admin/analytics?type=alerts&threshold=0.7")
      if (response.ok) {
        const data = await response.json()
        setAlerts(data.alerts || [])
      }
    } catch (error) {
      console.error("Failed to fetch alerts:", error)
    }
  }

  const fetchContributions = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/moderation?status=${moderationStatus}&limit=50`)
      if (response.ok) {
        const data = await response.json()
        setContributions(data.contributions || [])
        setContributionsTotal(data.total || 0)
      }
    } catch (error) {
      console.error("Failed to fetch contributions:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleModerate = async (id: string, status: "approved" | "rejected") => {
    try {
      const response = await fetch("/api/admin/moderation", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      })

      if (response.ok) {
        toast.success(`Contribution ${status}`)
        fetchContributions()
      } else {
        toast.error("Failed to update status")
      }
    } catch (error) {
      toast.error("Failed to update status")
    }
  }

  const handleBulkModerate = async (status: "approved" | "rejected") => {
    if (selectedIds.length === 0) return

    try {
      const response = await fetch("/api/admin/moderation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds, status }),
      })

      if (response.ok) {
        toast.success(`${selectedIds.length} contributions ${status}`)
        setSelectedIds([])
        fetchContributions()
      } else {
        toast.error("Failed to update statuses")
      }
    } catch (error) {
      toast.error("Failed to update statuses")
    }
  }

  const handleExport = async (format: "json" | "jsonl") => {
    try {
      const response = await fetch(`/api/admin/export?format=${format}`)
      if (format === "jsonl") {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `training_data_${new Date().toISOString().split("T")[0]}.jsonl`
        a.click()
        toast.success("Export downloaded")
      } else {
        const data = await response.json()
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `training_data_${new Date().toISOString().split("T")[0]}.json`
        a.click()
        toast.success("Export downloaded")
      }
    } catch (error) {
      toast.error("Export failed")
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">AI Training Admin</h1>
        <p className="mt-2 text-muted-foreground">
          Manage training data, review corrections, and monitor AI performance
        </p>
      </div>

      {/* Alerts Banner */}
      {alerts.length > 0 && (
        <Card className="mb-6 border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <AlertTriangle className="h-5 w-5" />
              {alerts.length} Active Alert{alerts.length !== 1 ? "s" : ""}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.slice(0, 3).map((alert, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-amber-800 dark:text-amber-300">{alert.message}</span>
                  <Badge variant="outline" className={cn(
                    alert.severity === "critical" && "border-red-500 text-red-600",
                    alert.severity === "high" && "border-orange-500 text-orange-600",
                    alert.severity === "medium" && "border-yellow-500 text-yellow-600"
                  )}>
                    {alert.severity}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="moderation">
            Moderation Queue
            {contributionsTotal > 0 && moderationStatus === "pending" && (
              <Badge variant="secondary" className="ml-2">{contributionsTotal}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="export">Export</TabsTrigger>
        </TabsList>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          {loading && !summary ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : summary ? (
            <>
              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Total Analyses</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">{summary.total_analyses}</p>
                    <p className="text-xs text-muted-foreground">Last 7 days</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Success Rate</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-emerald-600">
                      {(summary.success_rate * 100).toFixed(1)}%
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {summary.successful_analyses} successful
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Avg Confidence</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className={cn(
                      "text-3xl font-bold",
                      summary.avg_confidence >= 0.8 ? "text-emerald-600" :
                      summary.avg_confidence >= 0.6 ? "text-yellow-600" : "text-red-600"
                    )}>
                      {(summary.avg_confidence * 100).toFixed(1)}%
                    </p>
                    <p className="text-xs text-muted-foreground">Extraction quality</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Scope Gaps Found</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">{summary.total_scope_gaps}</p>
                    <p className="text-xs text-muted-foreground">Across all analyses</p>
                  </CardContent>
                </Card>
              </div>

              {/* Confidence by Trade */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingDown className="h-5 w-5" />
                    Confidence by Trade Type
                  </CardTitle>
                  <CardDescription>
                    Lowest confidence trades may need prompt improvements
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {summary.confidence_by_trade.map((trade) => (
                      <div key={trade.trade_type} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{trade.trade_type}</span>
                          <span className={cn(
                            trade.avg_confidence >= 0.8 ? "text-emerald-600" :
                            trade.avg_confidence >= 0.6 ? "text-yellow-600" : "text-red-600"
                          )}>
                            {(trade.avg_confidence * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-secondary overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all",
                              trade.avg_confidence >= 0.8 ? "bg-emerald-500" :
                              trade.avg_confidence >= 0.6 ? "bg-yellow-500" : "bg-red-500"
                            )}
                            style={{ width: `${trade.avg_confidence * 100}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {trade.total_runs} analyses, {(trade.low_confidence_rate * 100).toFixed(1)}% low confidence items
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Top Correction Patterns */}
              {summary.top_correction_patterns.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Top Correction Patterns</CardTitle>
                    <CardDescription>
                      Most common user corrections - consider updating prompts
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {summary.top_correction_patterns.map((pattern, i) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-secondary/50">
                          <div>
                            <span className="font-medium">{pattern.trade_type}</span>
                            <span className="text-muted-foreground mx-2">/</span>
                            <Badge variant="outline">{pattern.correction_type}</Badge>
                          </div>
                          <span className="font-mono text-sm">{pattern.count} corrections</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : null}
        </TabsContent>

        {/* Moderation Tab */}
        <TabsContent value="moderation" className="space-y-4">
          <div className="flex items-center justify-between">
            <Select value={moderationStatus} onValueChange={setModerationStatus}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="all">All</SelectItem>
              </SelectContent>
            </Select>

            {selectedIds.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {selectedIds.length} selected
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkModerate("approved")}
                  className="text-emerald-600"
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Approve All
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkModerate("rejected")}
                  className="text-red-600"
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Reject All
                </Button>
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : contributions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No {moderationStatus === "all" ? "" : moderationStatus} contributions found
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {contributions.map((contribution) => (
                <Card key={contribution.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(contribution.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedIds([...selectedIds, contribution.id])
                            } else {
                              setSelectedIds(selectedIds.filter((id) => id !== contribution.id))
                            }
                          }}
                          className="rounded"
                        />
                        <Badge variant="outline">{contribution.trade_type}</Badge>
                        <Badge variant="secondary">{contribution.correction_type}</Badge>
                        {contribution.confidence_score_original !== null && (
                          <span className="text-xs text-muted-foreground">
                            Original confidence: {(contribution.confidence_score_original * 100).toFixed(0)}%
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {contribution.moderation_status === "pending" ? (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleModerate(contribution.id, "approved")}
                              className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                            >
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleModerate(contribution.id, "rejected")}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        ) : (
                          <Badge variant={contribution.moderation_status === "approved" ? "default" : "destructive"}>
                            {contribution.moderation_status}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-medium text-muted-foreground mb-1">Original</p>
                        <pre className="p-2 rounded bg-red-50 dark:bg-red-950/20 text-xs overflow-auto max-h-32">
                          {JSON.stringify(contribution.original_value, null, 2)}
                        </pre>
                      </div>
                      <div>
                        <p className="font-medium text-muted-foreground mb-1">Corrected</p>
                        <pre className="p-2 rounded bg-emerald-50 dark:bg-emerald-950/20 text-xs overflow-auto max-h-32">
                          {JSON.stringify(contribution.corrected_value, null, 2)}
                        </pre>
                      </div>
                    </div>
                    {contribution.raw_text_snippet && (
                      <div className="mt-3">
                        <p className="font-medium text-muted-foreground mb-1 text-sm">Source Text</p>
                        <p className="text-xs text-muted-foreground bg-secondary/50 p-2 rounded">
                          {contribution.raw_text_snippet}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Export Tab */}
        <TabsContent value="export" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Export Training Data</CardTitle>
              <CardDescription>
                Download approved corrections for fine-tuning or analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Card className="border-2 border-dashed">
                  <CardHeader>
                    <CardTitle className="text-lg">JSONL (Fine-tuning)</CardTitle>
                    <CardDescription>
                      OpenAI-compatible format with system/user/assistant messages
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button onClick={() => handleExport("jsonl")} className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Download JSONL
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-2 border-dashed">
                  <CardHeader>
                    <CardTitle className="text-lg">JSON (Analysis)</CardTitle>
                    <CardDescription>
                      Raw contribution data for analysis and review
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button onClick={() => handleExport("json")} variant="outline" className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Download JSON
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Prompt Improvement Guide</CardTitle>
              <CardDescription>
                Use exported data to improve extraction prompts
              </CardDescription>
            </CardHeader>
            <CardContent className="prose dark:prose-invert text-sm">
              <ol className="space-y-2">
                <li>Export JSONL with corrections for low-confidence trade types</li>
                <li>Review common correction patterns in the Analytics tab</li>
                <li>Update prompts in <code>src/lib/ai/prompts/</code> with:
                  <ul className="mt-1">
                    <li>Trade-specific examples from corrections</li>
                    <li>Explicit handling of edge cases</li>
                    <li>Better category definitions</li>
                  </ul>
                </li>
                <li>Test updated prompts and monitor confidence metrics</li>
              </ol>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
