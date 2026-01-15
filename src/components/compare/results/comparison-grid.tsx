"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle2, XCircle, HelpCircle, AlertTriangle } from "lucide-react"
import { formatCurrency } from "@/lib/utils/format"
import type { ComparisonResult, BidDocumentWithItems, ScopeGap } from "@/types"

interface ComparisonGridProps {
  documents: BidDocumentWithItems[]
  results: ComparisonResult
}

type FilterType = "all" | "gaps" | "exclusions"

export function ComparisonGrid({ documents, results }: ComparisonGridProps) {
  const [filter, setFilter] = useState<FilterType>("all")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")

  // Build normalized comparison data
  const comparisonData = useMemo(() => {
    const summary = results.summary_json
    const scopeGaps = summary.scope_gaps || []

    // Get all unique normalized categories from all items
    const allItems = documents.flatMap((d) => d.extracted_items || [])
    const categories = [
      ...new Set(
        allItems
          .map((i) => i.normalized_category || i.category)
          .filter(Boolean)
      ),
    ].sort()

    // Group items by normalized description
    const itemsByDescription = new Map<
      string,
      {
        description: string
        category: string
        byContractor: Map<
          string,
          {
            price: number | null
            isExclusion: boolean
            confidence: number
            originalDescription: string
          }
        >
        isGap: boolean
        gapInfo?: ScopeGap
      }
    >()

    // Process all items
    for (const doc of documents) {
      for (const item of doc.extracted_items || []) {
        const key = item.normalized_category || item.description
        const existing = itemsByDescription.get(key)

        if (existing) {
          existing.byContractor.set(doc.id, {
            price: item.total_price,
            isExclusion: item.is_exclusion,
            confidence: item.confidence_score,
            originalDescription: item.description,
          })
        } else {
          const byContractor = new Map()
          byContractor.set(doc.id, {
            price: item.total_price,
            isExclusion: item.is_exclusion,
            confidence: item.confidence_score,
            originalDescription: item.description,
          })

          const gapInfo = scopeGaps.find(
            (g) =>
              g.description.toLowerCase() === key.toLowerCase() ||
              item.description.toLowerCase().includes(g.description.toLowerCase())
          )

          itemsByDescription.set(key, {
            description: key,
            category: item.category || "Other",
            byContractor,
            isGap: !!gapInfo,
            gapInfo,
          })
        }
      }
    }

    // Add scope gaps that might not have items
    for (const gap of scopeGaps) {
      if (!itemsByDescription.has(gap.description)) {
        const byContractor = new Map<string, {
          price: number | null
          isExclusion: boolean
          confidence: number
          originalDescription: string
        }>()

        // Mark contractors as having/not having this item
        for (const doc of documents) {
          const hasItem = gap.present_in.includes(doc.id)
          if (hasItem) {
            byContractor.set(doc.id, {
              price: gap.estimated_value,
              isExclusion: false,
              confidence: 0.7,
              originalDescription: gap.description,
            })
          }
        }

        itemsByDescription.set(gap.description, {
          description: gap.description,
          category: "Scope Gap",
          byContractor,
          isGap: true,
          gapInfo: gap,
        })
      }
    }

    return {
      items: Array.from(itemsByDescription.values()),
      categories,
    }
  }, [documents, results])

  // Filter items
  const filteredItems = useMemo(() => {
    let items = comparisonData.items

    if (filter === "gaps") {
      items = items.filter((item) => item.isGap)
    } else if (filter === "exclusions") {
      items = items.filter((item) =>
        Array.from(item.byContractor.values()).some((c) => c.isExclusion)
      )
    }

    if (selectedCategory !== "all") {
      items = items.filter((item) => item.category === selectedCategory)
    }

    return items
  }, [comparisonData.items, filter, selectedCategory])

  const getStatusIcon = (
    contractorId: string,
    item: (typeof comparisonData.items)[0]
  ) => {
    const data = item.byContractor.get(contractorId)

    if (!data) {
      // Not mentioned
      return (
        <div className="flex items-center gap-1 text-muted-foreground">
          <HelpCircle className="h-4 w-4" />
          <span className="text-sm">Not mentioned</span>
        </div>
      )
    }

    if (data.isExclusion) {
      return (
        <div className="flex items-center gap-1 text-red-600">
          <XCircle className="h-4 w-4" />
          <span className="text-sm">Excluded</span>
        </div>
      )
    }

    return (
      <div className="flex flex-col">
        <div className="flex items-center gap-1 text-green-600">
          <CheckCircle2 className="h-4 w-4" />
          <span className="font-medium">{formatCurrency(data.price)}</span>
        </div>
        {data.confidence < 0.8 && (
          <span className="text-xs text-amber-600">Low confidence</span>
        )}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Comparison Grid</CardTitle>

          <div className="flex flex-wrap items-center gap-2">
            <Tabs
              value={filter}
              onValueChange={(v) => setFilter(v as FilterType)}
            >
              <TabsList>
                <TabsTrigger value="all">All Items</TabsTrigger>
                <TabsTrigger value="gaps">
                  Gaps ({comparisonData.items.filter((i) => i.isGap).length})
                </TabsTrigger>
                <TabsTrigger value="exclusions">Exclusions</TabsTrigger>
              </TabsList>
            </Tabs>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {comparisonData.categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[200px]">Scope Item</TableHead>
                {documents.map((doc) => (
                  <TableHead key={doc.id} className="min-w-[150px] text-center">
                    {doc.contractor_name}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={documents.length + 1}
                    className="text-center text-muted-foreground"
                  >
                    No items match your filters
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item, index) => (
                  <TableRow
                    key={index}
                    className={item.isGap ? "bg-amber-50/50" : ""}
                  >
                    <TableCell>
                      <div className="flex items-start gap-2">
                        {item.isGap && (
                          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                        )}
                        <div>
                          <p className="font-medium">{item.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.category}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    {documents.map((doc) => (
                      <TableCell key={doc.id} className="text-center">
                        {getStatusIcon(doc.id, item)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap items-center gap-4 border-t pt-4 text-sm">
          <div className="flex items-center gap-1">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span>Included</span>
          </div>
          <div className="flex items-center gap-1">
            <XCircle className="h-4 w-4 text-red-600" />
            <span>Excluded</span>
          </div>
          <div className="flex items-center gap-1">
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
            <span>Not mentioned</span>
          </div>
          <div className="flex items-center gap-1">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <span>Scope gap</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
