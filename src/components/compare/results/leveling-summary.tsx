"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowDown, ArrowUp, Minus, Scale, TrendingDown, TrendingUp } from "lucide-react"
import { formatCurrency } from "@/lib/utils/format"
import { cn } from "@/lib/utils"
import type { ContractorLeveledTotals, BidDocumentWithItems } from "@/types"

interface LevelingSummaryProps {
  documents: BidDocumentWithItems[]
  leveledTotals: ContractorLeveledTotals[]
  isEnabled: boolean
}

export function LevelingSummary({
  documents,
  leveledTotals,
  isEnabled,
}: LevelingSummaryProps) {
  // Calculate rankings for both as-bid and leveled
  const rankings = useMemo(() => {
    const asBidRanking = [...documents]
      .map((doc) => {
        const total = (doc.extracted_items || [])
          .filter((i) => !i.is_exclusion)
          .reduce((sum, i) => sum + (i.total_price || 0), 0)
        return { id: doc.id, name: doc.contractor_name, total }
      })
      .sort((a, b) => a.total - b.total)

    const leveledRanking = [...leveledTotals]
      .sort((a, b) => a.leveledTotal - b.leveledTotal)
      .map((lt) => {
        const doc = documents.find((d) => d.id === lt.contractorId)
        return {
          id: lt.contractorId,
          name: doc?.contractor_name || "Unknown",
          total: lt.leveledTotal,
          asBidTotal: lt.asBidTotal,
          difference: lt.difference,
          percentDifference: lt.percentDifference,
        }
      })

    return { asBid: asBidRanking, leveled: leveledRanking }
  }, [documents, leveledTotals])

  if (!isEnabled || leveledTotals.length === 0) {
    return null
  }

  // Check if rankings changed after leveling
  const rankingsChanged = useMemo(() => {
    const asBidOrder = rankings.asBid.map((r) => r.id)
    const leveledOrder = rankings.leveled.map((r) => r.id)
    return asBidOrder.join(",") !== leveledOrder.join(",")
  }, [rankings])

  return (
    <Card className="border-violet-200 bg-violet-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Scale className="h-5 w-5 text-violet-600" />
          Bid Leveling Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Ranking change alert */}
          {rankingsChanged && (
            <div className="rounded-lg bg-amber-100 px-3 py-2 text-sm text-amber-800">
              <strong>Note:</strong> After leveling for consistent quantities,
              the bid rankings have changed.
            </div>
          )}

          {/* Leveled rankings table */}
          <div className="rounded-lg border bg-background">
            <table className="w-full">
              <thead>
                <tr className="border-b text-xs text-muted-foreground">
                  <th className="px-3 py-2 text-left">Rank</th>
                  <th className="px-3 py-2 text-left">Contractor</th>
                  <th className="px-3 py-2 text-right">As-Bid</th>
                  <th className="px-3 py-2 text-right">Leveled</th>
                  <th className="px-3 py-2 text-right">Change</th>
                </tr>
              </thead>
              <tbody>
                {rankings.leveled.map((contractor, index) => {
                  const originalRank = rankings.asBid.findIndex(
                    (r) => r.id === contractor.id
                  )
                  const rankChange = originalRank - index

                  return (
                    <tr
                      key={contractor.id}
                      className={cn(
                        "border-b last:border-0",
                        index === 0 && "bg-green-50"
                      )}
                    >
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium">{index + 1}</span>
                          {rankChange !== 0 && (
                            <RankChangeIndicator change={rankChange} />
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2 font-medium">
                        {contractor.name}
                        {index === 0 && (
                          <Badge className="ml-2" variant="secondary">
                            Lowest
                          </Badge>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-sm text-muted-foreground">
                        {formatCurrency(contractor.asBidTotal)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-sm font-medium">
                        {formatCurrency(contractor.total)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <DifferenceIndicator
                          difference={contractor.difference}
                          percent={contractor.percentDifference}
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="text-xs text-muted-foreground">
            Leveled totals recalculate prices using consistent quantities across
            all bids. This helps compare &quot;apples to apples&quot; when quantities
            differ.
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function RankChangeIndicator({ change }: { change: number }) {
  if (change === 0) {
    return <Minus className="h-3 w-3 text-muted-foreground" />
  }

  if (change > 0) {
    return (
      <div className="flex items-center text-green-600">
        <TrendingUp className="h-3 w-3" />
        <span className="text-xs ml-0.5">+{change}</span>
      </div>
    )
  }

  return (
    <div className="flex items-center text-red-600">
      <TrendingDown className="h-3 w-3" />
      <span className="text-xs ml-0.5">{change}</span>
    </div>
  )
}

function DifferenceIndicator({
  difference,
  percent,
}: {
  difference: number
  percent: number
}) {
  if (Math.abs(difference) < 1) {
    return <span className="text-muted-foreground">—</span>
  }

  const isPositive = difference > 0

  return (
    <div
      className={cn(
        "flex items-center justify-end gap-1 text-sm",
        isPositive ? "text-red-600" : "text-green-600"
      )}
    >
      {isPositive ? (
        <ArrowUp className="h-3 w-3" />
      ) : (
        <ArrowDown className="h-3 w-3" />
      )}
      <span className="font-mono">
        {isPositive ? "+" : ""}
        {percent.toFixed(1)}%
      </span>
    </div>
  )
}
