"use client"

import { useState, useEffect } from "react"
import { History, RotateCcw, Loader2, User, AlertCircle } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { formatCurrency } from "@/lib/utils/format"
import type { ItemEditHistoryGrouped, EditHistoryFieldName } from "@/types"

interface ItemHistoryPanelProps {
  itemId: string
  itemDescription: string
  onRevert?: () => void
}

// Format a field name for display
function formatFieldName(field: EditHistoryFieldName): string {
  const labels: Record<EditHistoryFieldName, string> = {
    description: "Description",
    quantity: "Quantity",
    unit: "Unit",
    unit_price: "Unit Price",
    total_price: "Total Price",
    category: "Category",
    normalized_category: "Normalized Category",
    is_exclusion: "Exclusion Status",
    is_inclusion: "Inclusion Status",
    breakdown_category: "Breakdown Category",
  }
  return labels[field] || field
}

// Format a value for display based on field type
function formatValue(field: EditHistoryFieldName, value: unknown): string {
  if (value === null || value === undefined) {
    return "—"
  }

  if (field === "total_price" || field === "unit_price") {
    return formatCurrency(value as number)
  }

  if (field === "is_exclusion" || field === "is_inclusion") {
    return value ? "Yes" : "No"
  }

  return String(value)
}

// Format relative time
function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMinutes < 1) return "Just now"
  if (diffMinutes < 60) return `${diffMinutes}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString()
}

export function ItemHistoryPanel({
  itemId,
  itemDescription,
  onRevert,
}: ItemHistoryPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [history, setHistory] = useState<ItemEditHistoryGrouped[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [revertingBatch, setRevertingBatch] = useState<string | null>(null)

  // Fetch history when panel opens
  useEffect(() => {
    if (!isOpen) return

    async function fetchHistory() {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/items/${itemId}/history`)
        if (!response.ok) {
          throw new Error("Failed to fetch history")
        }

        const data = await response.json()
        setHistory(data.history || [])
      } catch (err) {
        console.error("Error fetching history:", err)
        setError("Failed to load history")
      } finally {
        setIsLoading(false)
      }
    }

    fetchHistory()
  }, [isOpen, itemId])

  // Handle revert
  const handleRevert = async (batchId: string) => {
    setRevertingBatch(batchId)

    try {
      const response = await fetch(`/api/items/${itemId}/revert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batch_id: batchId }),
      })

      if (!response.ok) {
        throw new Error("Failed to revert")
      }

      // Refresh history
      const historyResponse = await fetch(`/api/items/${itemId}/history`)
      if (historyResponse.ok) {
        const data = await historyResponse.json()
        setHistory(data.history || [])
      }

      // Notify parent
      onRevert?.()
    } catch (err) {
      console.error("Error reverting:", err)
      setError("Failed to revert changes")
    } finally {
      setRevertingBatch(null)
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1">
          <History className="h-4 w-4" />
          History
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Edit History
          </SheetTitle>
          <SheetDescription className="line-clamp-2">
            {itemDescription}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <History className="h-8 w-8 mb-2" />
              <p>No edit history</p>
              <p className="text-sm">Changes will appear here when you edit this item</p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((batch) => (
                <div
                  key={batch.batch_id}
                  className="border rounded-lg p-4 space-y-3"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span>
                        {batch.user?.full_name || batch.user?.email || "Unknown user"}
                      </span>
                      <span>•</span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <span>{formatRelativeTime(batch.created_at)}</span>
                          </TooltipTrigger>
                          <TooltipContent>
                            {new Date(batch.created_at).toLocaleString()}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 gap-1"
                            onClick={() => handleRevert(batch.batch_id)}
                            disabled={revertingBatch === batch.batch_id}
                          >
                            {revertingBatch === batch.batch_id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <RotateCcw className="h-3 w-3" />
                            )}
                            Revert
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          Revert to values before this change
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>

                  {/* Change reason */}
                  {batch.change_reason && (
                    <p className="text-sm text-muted-foreground italic">
                      "{batch.change_reason}"
                    </p>
                  )}

                  {/* Changes */}
                  <div className="space-y-2">
                    {batch.changes.map((change, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2 text-sm"
                      >
                        <Badge variant="outline" className="shrink-0">
                          {formatFieldName(change.field_name)}
                        </Badge>
                        <div className="flex items-center gap-1 min-w-0">
                          <span className="text-red-600 line-through truncate">
                            {formatValue(change.field_name, change.old_value)}
                          </span>
                          <span className="text-muted-foreground">→</span>
                          <span className="text-green-600 truncate">
                            {formatValue(change.field_name, change.new_value)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
