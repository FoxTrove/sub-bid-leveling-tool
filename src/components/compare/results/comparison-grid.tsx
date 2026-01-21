"use client"

import { useState, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { AlertTriangle, CheckCircle2, XCircle, HelpCircle, Pencil } from "lucide-react"
import { EditableCell, type CellData, type CorrectionInput } from "./editable-cell"
import type { ComparisonResult, BidDocumentWithItems, ScopeGap, ExtractedItem } from "@/types"

interface ComparisonGridProps {
  documents: BidDocumentWithItems[]
  results: ComparisonResult
  projectId: string
  tradeType: string
  userOptedIn: boolean
}

type FilterType = "all" | "gaps" | "exclusions"

export function ComparisonGrid({
  documents,
  results,
  projectId,
  tradeType,
  userOptedIn,
}: ComparisonGridProps) {
  const router = useRouter()
  const [filter, setFilter] = useState<FilterType>("all")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")

  // Handle correction callback
  const handleCorrection = useCallback(
    (correction: CorrectionInput) => {
      // Refresh the page to show updated data
      router.refresh()
    },
    [router]
  )

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
          .filter((c): c is string => Boolean(c))
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
            itemId: string
            fullItem: ExtractedItem
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
            itemId: item.id,
            fullItem: item,
          })
        } else {
          const byContractor = new Map()
          byContractor.set(doc.id, {
            price: item.total_price,
            isExclusion: item.is_exclusion,
            confidence: item.confidence_score,
            originalDescription: item.description,
            itemId: item.id,
            fullItem: item,
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
          itemId: string
          fullItem: ExtractedItem
        }>()

        // Mark contractors as having/not having this item
        // Note: Scope gaps without items cannot be edited (no item to update)

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

  // Get document type for the first document (used for training contributions)
  const documentType = useMemo(() => {
    const firstDoc = documents[0]
    return firstDoc?.file_name?.split('.').pop() || 'pdf'
  }, [documents])

  // Helper to get cell data for a contractor
  const getCellData = (
    contractorId: string,
    item: (typeof comparisonData.items)[0]
  ): { data: CellData | undefined; fullItem: ExtractedItem | undefined } => {
    const contractorData = item.byContractor.get(contractorId)

    if (!contractorData) {
      return { data: undefined, fullItem: undefined }
    }

    return {
      data: {
        price: contractorData.price,
        isExclusion: contractorData.isExclusion,
        confidence: contractorData.confidence,
        originalDescription: contractorData.originalDescription,
        itemId: contractorData.itemId,
      },
      fullItem: contractorData.fullItem,
    }
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
                    {documents.map((doc) => {
                      const { data, fullItem } = getCellData(doc.id, item)
                      return (
                        <TableCell key={doc.id} className="text-center">
                          <EditableCell
                            data={data}
                            documentId={doc.id}
                            projectId={projectId}
                            tradeType={tradeType}
                            documentType={documentType}
                            normalizedDescription={item.description}
                            category={item.category}
                            userOptedIn={userOptedIn}
                            onCorrection={handleCorrection}
                            fullItem={fullItem}
                          />
                        </TableCell>
                      )
                    })}
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
          <div className="flex items-center gap-1 text-muted-foreground">
            <Pencil className="h-4 w-4" />
            <span>Hover to edit</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
