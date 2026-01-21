"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  CheckCircle2,
  XCircle,
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

export default function TrainingModerationPage() {
  const [contributions, setContributions] = useState<Contribution[]>([])
  const [contributionsTotal, setContributionsTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [moderationStatus, setModerationStatus] = useState("pending")
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  useEffect(() => {
    fetchContributions()
  }, [moderationStatus])

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Moderation Queue</h1>
        <p className="text-slate-400 mt-1">
          Review and approve training contributions
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between">
        <Select value={moderationStatus} onValueChange={setModerationStatus}>
          <SelectTrigger className="w-40 bg-slate-900 border-slate-700 text-slate-100">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-700">
            <SelectItem value="pending" className="text-slate-100">Pending</SelectItem>
            <SelectItem value="approved" className="text-slate-100">Approved</SelectItem>
            <SelectItem value="rejected" className="text-slate-100">Rejected</SelectItem>
            <SelectItem value="all" className="text-slate-100">All</SelectItem>
          </SelectContent>
        </Select>

        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">
              {selectedIds.length} selected
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkModerate("approved")}
              className="border-emerald-800 text-emerald-400 hover:bg-emerald-900/30"
            >
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Approve All
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkModerate("rejected")}
              className="border-red-800 text-red-400 hover:bg-red-900/30"
            >
              <XCircle className="h-4 w-4 mr-1" />
              Reject All
            </Button>
          </div>
        )}
      </div>

      {/* Contributions List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
        </div>
      ) : contributions.length === 0 ? (
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="py-12 text-center text-slate-400">
            No {moderationStatus === "all" ? "" : moderationStatus} contributions found
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {contributions.map((contribution) => (
            <Card key={contribution.id} className="bg-slate-900 border-slate-800 overflow-hidden">
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
                      className="rounded bg-slate-800 border-slate-600"
                    />
                    <Badge variant="outline" className="text-slate-300 border-slate-600">
                      {contribution.trade_type}
                    </Badge>
                    <Badge variant="outline" className="bg-slate-800 text-slate-400 border-slate-700">
                      {contribution.correction_type}
                    </Badge>
                    {contribution.confidence_score_original !== null && (
                      <span className="text-xs text-slate-500">
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
                          className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-900/30"
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleModerate(contribution.id, "rejected")}
                          className="text-red-400 hover:text-red-300 hover:bg-red-900/30"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </>
                    ) : (
                      <Badge
                        variant={contribution.moderation_status === "approved" ? "default" : "destructive"}
                        className={
                          contribution.moderation_status === "approved"
                            ? "bg-emerald-900/50 text-emerald-400"
                            : "bg-red-900/50 text-red-400"
                        }
                      >
                        {contribution.moderation_status}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-slate-400 mb-1">Original</p>
                    <pre className="p-2 rounded bg-red-950/20 border border-red-900/30 text-xs overflow-auto max-h-32 text-red-300">
                      {JSON.stringify(contribution.original_value, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <p className="font-medium text-slate-400 mb-1">Corrected</p>
                    <pre className="p-2 rounded bg-emerald-950/20 border border-emerald-900/30 text-xs overflow-auto max-h-32 text-emerald-300">
                      {JSON.stringify(contribution.corrected_value, null, 2)}
                    </pre>
                  </div>
                </div>
                {contribution.raw_text_snippet && (
                  <div className="mt-3">
                    <p className="font-medium text-slate-400 mb-1 text-sm">Source Text</p>
                    <p className="text-xs text-slate-500 bg-slate-800/50 p-2 rounded">
                      {contribution.raw_text_snippet}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
