"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface Alert {
  type: string
  severity: string
  trade_type: string
  avg_confidence: number
  sample_count: number
  message: string
}

export function AlertsBanner() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAlerts() {
      try {
        const response = await fetch("/api/admin/analytics?type=alerts&threshold=0.7&min_samples=5")
        if (response.ok) {
          const data = await response.json()
          setAlerts(data.alerts || [])
        }
      } catch (error) {
        console.error("Failed to fetch alerts:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchAlerts()
  }, [])

  if (loading || alerts.length === 0) {
    return null
  }

  return (
    <Card className="bg-amber-950/20 border-amber-800/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2 text-amber-400">
          <AlertTriangle className="h-5 w-5" />
          {alerts.length} Active Alert{alerts.length !== 1 ? "s" : ""}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {alerts.slice(0, 3).map((alert, i) => (
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
          {alerts.length > 3 && (
            <Link
              href="/admin/analytics/ai-quality"
              className="flex items-center gap-1 text-sm text-amber-400 hover:text-amber-300 transition-colors mt-2"
            >
              View all {alerts.length} alerts
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
