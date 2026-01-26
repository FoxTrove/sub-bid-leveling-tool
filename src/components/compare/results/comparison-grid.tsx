"use client"

import { useState, useMemo, useCallback, Fragment, useEffect, useRef } from "react"
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { AlertTriangle, CheckCircle2, XCircle, HelpCircle, Pencil, FileText, ChevronDown, ChevronRight, Minus, Keyboard, Shield, Scale, Target, ToggleLeft } from "lucide-react"
import { EditableCell, type CellData, type CorrectionInput } from "./editable-cell"
import { BidQualityBadge } from "./bid-quality-badge"
import { LevelingSummary } from "./leveling-summary"
import { InlineBaselineSelector } from "./baseline-selector"
import { useDocumentViewer } from "@/contexts/document-viewer-context"
import { formatCurrency } from "@/lib/utils/format"
import { analyzeBidQuality } from "@/lib/ai/analysis/bid-quality"
import { cn } from "@/lib/utils"
import type { ComparisonResult, BidDocumentWithItems, ScopeGap, ExtractedItem, BidDocument, BidQualityAnalysis, ItemBaseline, ContractorLeveledTotals, LevelingConfig } from "@/types"

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
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set())
  const [showSubtotals, setShowSubtotals] = useState(true)

  // Leveling state
  type ViewMode = "as-bid" | "leveled"
  const [viewMode, setViewMode] = useState<ViewMode>("as-bid")
  const [baselines, setBaselines] = useState<ItemBaseline[]>(
    results.leveling_json?.baselines || []
  )
  const [isSavingLeveling, setIsSavingLeveling] = useState(false)

  // Keyboard navigation state
  const [selectedRow, setSelectedRow] = useState<number>(-1)
  const [selectedCol, setSelectedCol] = useState<number>(0)
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null)
  const tableRef = useRef<HTMLTableElement>(null)

  // Document viewer integration
  const {
    isOpen: isViewerOpen,
    openPanel,
    setActiveDocument,
  } = useDocumentViewer()

  // Toggle category collapse
  const toggleCategory = useCallback((category: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(category)) {
        next.delete(category)
      } else {
        next.add(category)
      }
      return next
    })
  }, [])

  // Expand/collapse all categories
  const toggleAllCategories = useCallback((expand: boolean) => {
    if (expand) {
      setCollapsedCategories(new Set())
    } else {
      // Collapse all categories from the data
      const allCategories = new Set<string>()
      documents.forEach((doc) => {
        (doc.extracted_items || []).forEach((item) => {
          allCategories.add(item.category || "Other")
        })
      })
      setCollapsedCategories(allCategories)
    }
  }, [documents])

  // Handle opening document viewer for a contractor
  const handleOpenDocument = useCallback(
    (doc: BidDocumentWithItems) => {
      // Convert to BidDocument type
      const { extracted_items, ...bidDoc } = doc

      if (!isViewerOpen) {
        openPanel()
      }
      setActiveDocument(bidDoc as BidDocument)
    },
    [isViewerOpen, openPanel, setActiveDocument]
  )

  // Handle correction callback
  const handleCorrection = useCallback(
    (correction: CorrectionInput) => {
      // Refresh the page to show updated data
      router.refresh()
    },
    [router]
  )

  // ============================================
  // LEVELING HANDLERS
  // ============================================

  // Set a baseline for an item
  const handleSetBaseline = useCallback(
    async (
      itemDescription: string,
      contractorId: string,
      quantity: number,
      unit: string
    ) => {
      // Check if there's already a baseline for this item
      const existingIndex = baselines.findIndex(
        (b) => b.normalizedDescription === itemDescription
      )

      let newBaselines: ItemBaseline[]
      if (existingIndex >= 0) {
        // Update existing baseline
        newBaselines = [...baselines]
        newBaselines[existingIndex] = {
          normalizedDescription: itemDescription,
          baselineContractorId: contractorId,
          baselineQuantity: quantity,
          baselineUnit: unit,
        }
      } else {
        // Add new baseline
        newBaselines = [
          ...baselines,
          {
            normalizedDescription: itemDescription,
            baselineContractorId: contractorId,
            baselineQuantity: quantity,
            baselineUnit: unit,
          },
        ]
      }

      setBaselines(newBaselines)
      await saveLevelingConfig(newBaselines)
    },
    [baselines, projectId]
  )

  // Clear a baseline for an item
  const handleClearBaseline = useCallback(
    async (itemDescription: string) => {
      const newBaselines = baselines.filter(
        (b) => b.normalizedDescription !== itemDescription
      )
      setBaselines(newBaselines)
      await saveLevelingConfig(newBaselines)
    },
    [baselines, projectId]
  )

  // Save leveling configuration to API
  const saveLevelingConfig = useCallback(
    async (newBaselines: ItemBaseline[]) => {
      setIsSavingLeveling(true)

      try {
        // Calculate leveled totals for each contractor
        const leveledTotals: ContractorLeveledTotals[] = documents.map((doc) => {
          const items = doc.extracted_items || []
          const nonExclusionItems = items.filter((i) => !i.is_exclusion)

          // Calculate as-bid total
          const asBidTotal = nonExclusionItems.reduce(
            (sum, i) => sum + (i.total_price || 0),
            0
          )

          // Calculate leveled total
          let leveledTotal = 0
          for (const item of nonExclusionItems) {
            const baseline = newBaselines.find(
              (b) =>
                b.normalizedDescription === item.description ||
                b.normalizedDescription === item.normalized_category
            )

            if (baseline && item.unit_price) {
              // Use baseline quantity × this item's unit price
              leveledTotal += baseline.baselineQuantity * item.unit_price
            } else {
              // No baseline for this item, use as-bid price
              leveledTotal += item.total_price || 0
            }
          }

          const difference = leveledTotal - asBidTotal
          const percentDifference = asBidTotal > 0 ? (difference / asBidTotal) * 100 : 0

          return {
            contractorId: doc.id,
            asBidTotal,
            leveledTotal,
            difference,
            percentDifference,
          }
        })

        const config: LevelingConfig = {
          isEnabled: newBaselines.length > 0,
          baselines: newBaselines,
          leveledTotals,
          lastUpdated: new Date().toISOString(),
        }

        await fetch(`/api/projects/${projectId}/leveling`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ leveling: config }),
        })
      } catch (error) {
        console.error("Failed to save leveling config:", error)
      } finally {
        setIsSavingLeveling(false)
      }
    },
    [documents, projectId]
  )

  // Get baseline for an item description
  const getBaselineForItem = useCallback(
    (itemDescription: string) => {
      return baselines.find((b) => b.normalizedDescription === itemDescription)
    },
    [baselines]
  )

  // Calculate leveled totals (memoized)
  const leveledTotals = useMemo((): ContractorLeveledTotals[] => {
    return documents.map((doc) => {
      const items = doc.extracted_items || []
      const nonExclusionItems = items.filter((i) => !i.is_exclusion)

      // Calculate as-bid total
      const asBidTotal = nonExclusionItems.reduce(
        (sum, i) => sum + (i.total_price || 0),
        0
      )

      // Calculate leveled total
      let leveledTotal = 0
      for (const item of nonExclusionItems) {
        const baseline = baselines.find(
          (b) =>
            b.normalizedDescription === item.description ||
            b.normalizedDescription === item.normalized_category
        )

        if (baseline && item.unit_price) {
          leveledTotal += baseline.baselineQuantity * item.unit_price
        } else {
          leveledTotal += item.total_price || 0
        }
      }

      const difference = leveledTotal - asBidTotal
      const percentDifference = asBidTotal > 0 ? (difference / asBidTotal) * 100 : 0

      return {
        contractorId: doc.id,
        asBidTotal,
        leveledTotal,
        difference,
        percentDifference,
      }
    })
  }, [documents, baselines])

  // ============================================
  // END LEVELING HANDLERS
  // ============================================

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

  // Calculate bid quality analysis for each document
  const qualityAnalysisByDocument = useMemo(() => {
    const analyses = new Map<string, BidQualityAnalysis>()

    // Get all bid totals for outlier comparison
    const allBidTotals = documents.map((doc) => {
      const items = doc.extracted_items || []
      return items
        .filter((i) => !i.is_exclusion)
        .reduce((sum, i) => sum + (i.total_price || 0), 0)
    })

    const averageBid =
      allBidTotals.length > 0
        ? allBidTotals.reduce((a, b) => a + b, 0) / allBidTotals.length
        : 0

    for (const doc of documents) {
      const items = doc.extracted_items || []
      const totalBid = items
        .filter((i) => !i.is_exclusion)
        .reduce((sum, i) => sum + (i.total_price || 0), 0)

      const analysis = analyzeBidQuality({
        items,
        tradeType,
        totalBid,
        averageBid,
        allBidTotals,
      })

      analyses.set(doc.id, analysis)
    }

    return analyses
  }, [documents, tradeType])

  // Group items by category with subtotals
  const groupedItems = useMemo(() => {
    const groups = new Map<string, {
      category: string
      items: typeof filteredItems
      subtotals: Map<string, number> // contractor ID -> total
      hasGaps: boolean
    }>()

    // Group items by category
    for (const item of filteredItems) {
      const category = item.category || "Other"
      if (!groups.has(category)) {
        groups.set(category, {
          category,
          items: [],
          subtotals: new Map(),
          hasGaps: false,
        })
      }

      const group = groups.get(category)!
      group.items.push(item)

      if (item.isGap) {
        group.hasGaps = true
      }

      // Calculate subtotals per contractor
      for (const doc of documents) {
        const contractorData = item.byContractor.get(doc.id)
        if (contractorData && contractorData.price && !contractorData.isExclusion) {
          const current = group.subtotals.get(doc.id) || 0
          group.subtotals.set(doc.id, current + contractorData.price)
        }
      }
    }

    // Sort groups by category name
    return Array.from(groups.values()).sort((a, b) =>
      a.category.localeCompare(b.category)
    )
  }, [filteredItems, documents])

  // Flat list of navigable rows (excluding collapsed categories)
  const navigableRows = useMemo(() => {
    const rows: Array<{
      type: "category" | "item"
      category: string
      item?: (typeof filteredItems)[0]
      index: number
    }> = []

    let index = 0
    for (const group of groupedItems) {
      // Category header is always navigable
      rows.push({ type: "category", category: group.category, index })
      index++

      // Items only if not collapsed
      if (!collapsedCategories.has(group.category)) {
        for (const item of group.items) {
          rows.push({ type: "item", category: group.category, item, index })
          index++
        }
      }
    }
    return rows
  }, [groupedItems, collapsedCategories])

  // Keyboard navigation handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture events if typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        editingCell !== null
      ) {
        return
      }

      const maxRow = navigableRows.length - 1
      const maxCol = documents.length - 1

      switch (e.key) {
        case "j": // Move down
        case "ArrowDown":
          e.preventDefault()
          setSelectedRow((r) => Math.min(r + 1, maxRow))
          break

        case "k": // Move up
        case "ArrowUp":
          e.preventDefault()
          setSelectedRow((r) => Math.max(r - 1, 0))
          break

        case "h": // Move left
        case "ArrowLeft":
          e.preventDefault()
          setSelectedCol((c) => Math.max(c - 1, 0))
          break

        case "l": // Move right
        case "ArrowRight":
          e.preventDefault()
          setSelectedCol((c) => Math.min(c + 1, maxCol))
          break

        case "Enter":
        case " ": // Toggle category or open edit
          e.preventDefault()
          if (selectedRow >= 0) {
            const row = navigableRows[selectedRow]
            if (row?.type === "category") {
              toggleCategory(row.category)
            } else if (row?.type === "item" && row.item) {
              // Trigger edit for the selected cell
              setEditingCell({ row: selectedRow, col: selectedCol })
            }
          }
          break

        case "e": // Edit selected cell
          e.preventDefault()
          if (selectedRow >= 0) {
            const row = navigableRows[selectedRow]
            if (row?.type === "item" && row.item) {
              setEditingCell({ row: selectedRow, col: selectedCol })
            }
          }
          break

        case "Escape": // Clear selection
          e.preventDefault()
          setSelectedRow(-1)
          setEditingCell(null)
          break

        case "g": // Go to top
          if (e.shiftKey) {
            e.preventDefault()
            setSelectedRow(maxRow)
          } else {
            e.preventDefault()
            setSelectedRow(0)
          }
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [navigableRows, documents.length, editingCell, selectedRow, selectedCol, toggleCategory])

  // Scroll selected row into view
  useEffect(() => {
    if (selectedRow >= 0 && tableRef.current) {
      const rows = tableRef.current.querySelectorAll("tbody tr")
      const selectedElement = rows[selectedRow]
      if (selectedElement) {
        selectedElement.scrollIntoView({ behavior: "smooth", block: "nearest" })
      }
    }
  }, [selectedRow])

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

            <div className="flex items-center gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleAllCategories(true)}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Expand all categories</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleAllCategories(false)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Collapse all categories</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* Keyboard shortcuts help */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-1">
                    <Keyboard className="h-4 w-4" />
                    <span className="hidden sm:inline">Shortcuts</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <div className="grid gap-1 text-xs">
                    <div className="font-medium mb-1">Keyboard Shortcuts</div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                      <span className="text-muted-foreground">j / ↓</span>
                      <span>Move down</span>
                      <span className="text-muted-foreground">k / ↑</span>
                      <span>Move up</span>
                      <span className="text-muted-foreground">h / ←</span>
                      <span>Move left</span>
                      <span className="text-muted-foreground">l / →</span>
                      <span>Move right</span>
                      <span className="text-muted-foreground">Enter / Space</span>
                      <span>Toggle / Edit</span>
                      <span className="text-muted-foreground">e</span>
                      <span>Edit cell</span>
                      <span className="text-muted-foreground">g / G</span>
                      <span>Top / Bottom</span>
                      <span className="text-muted-foreground">Esc</span>
                      <span>Clear selection</span>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Leveling toggle */}
            <div className="flex items-center gap-2 border-l pl-2 ml-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={viewMode === "leveled" ? "secondary" : "outline"}
                      size="sm"
                      onClick={() =>
                        setViewMode(viewMode === "as-bid" ? "leveled" : "as-bid")
                      }
                      className="gap-1.5"
                      disabled={baselines.length === 0}
                    >
                      <Scale className="h-4 w-4" />
                      <span className="hidden sm:inline">
                        {viewMode === "as-bid" ? "As-Bid" : "Leveled"}
                      </span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {baselines.length === 0
                      ? "Set baselines to enable leveling"
                      : viewMode === "as-bid"
                        ? "Switch to leveled view"
                        : "Switch to as-bid view"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              {baselines.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {baselines.length} baseline{baselines.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Leveling Summary (when enabled) */}
        {baselines.length > 0 && viewMode === "leveled" && (
          <div className="mb-4">
            <LevelingSummary
              documents={documents}
              leveledTotals={leveledTotals}
              isEnabled={true}
            />
          </div>
        )}
        <div className="overflow-x-auto">
          <Table ref={tableRef}>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[200px]">Scope Item</TableHead>
                {documents.map((doc) => {
                  const qualityAnalysis = qualityAnalysisByDocument.get(doc.id) || null
                  return (
                    <TableHead key={doc.id} className="min-w-[150px]">
                      <div className="flex flex-col items-center gap-1">
                        <div className="flex items-center gap-2">
                          <span>{doc.contractor_name}</span>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => handleOpenDocument(doc)}
                                >
                                  <FileText className="h-4 w-4" />
                                  <span className="sr-only">View bid document</span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>View bid document</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        {qualityAnalysis && (
                          <BidQualityBadge
                            analysis={qualityAnalysis}
                            contractorName={doc.contractor_name}
                          />
                        )}
                      </div>
                    </TableHead>
                  )
                })}
              </TableRow>
            </TableHeader>
            <TableBody>
              {groupedItems.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={documents.length + 1}
                    className="text-center text-muted-foreground"
                  >
                    No items match your filters
                  </TableCell>
                </TableRow>
              ) : (
                (() => {
                  let rowIndex = 0
                  return groupedItems.map((group) => {
                    const isCollapsed = collapsedCategories.has(group.category)
                    const categoryRowIndex = rowIndex
                    rowIndex++

                    return (
                      <Fragment key={group.category}>
                        {/* Category Header Row */}
                        <TableRow
                          className={cn(
                            "bg-muted/50 hover:bg-muted/70 cursor-pointer",
                            selectedRow === categoryRowIndex && "ring-2 ring-primary ring-inset"
                          )}
                          onClick={() => {
                            toggleCategory(group.category)
                            setSelectedRow(categoryRowIndex)
                          }}
                        >
                          <TableCell className="font-semibold">
                            <div className="flex items-center gap-2">
                              {isCollapsed ? (
                                <ChevronRight className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                              <span>{group.category}</span>
                              <span className="text-xs text-muted-foreground font-normal">
                                ({group.items.length} items)
                              </span>
                              {group.hasGaps && (
                                <AlertTriangle className="h-4 w-4 text-amber-600" />
                              )}
                            </div>
                          </TableCell>
                          {/* Category subtotals */}
                          {documents.map((doc) => (
                            <TableCell
                              key={doc.id}
                              className="text-center font-semibold"
                            >
                              {group.subtotals.has(doc.id) ? (
                                formatCurrency(group.subtotals.get(doc.id)!)
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                        ))}
                      </TableRow>

                      {/* Category Items */}
                      {!isCollapsed &&
                        group.items.map((item, itemIdx) => {
                          const currentRowIndex = rowIndex
                          rowIndex++
                          return (
                            <TableRow
                              key={`${group.category}-${itemIdx}`}
                              className={cn(
                                item.isGap ? "bg-amber-50/50" : "",
                                "hover:bg-muted/30",
                                selectedRow === currentRowIndex && "ring-2 ring-primary ring-inset"
                              )}
                              onClick={() => setSelectedRow(currentRowIndex)}
                            >
                              <TableCell>
                                <div className="flex items-start gap-2 pl-6">
                                  {item.isGap && (
                                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                                  )}
                                  <div>
                                    <p className="font-medium">{item.description}</p>
                                  </div>
                                </div>
                              </TableCell>
                              {documents.map((doc, colIdx) => {
                                const { data, fullItem } = getCellData(doc.id, item)
                                const isSelectedCell = selectedRow === currentRowIndex && selectedCol === colIdx
                                return (
                                  <TableCell
                                    key={doc.id}
                                    className={cn(
                                      "text-center",
                                      isSelectedCell && "bg-primary/10"
                                    )}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setSelectedRow(currentRowIndex)
                                      setSelectedCol(colIdx)
                                    }}
                                  >
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
                                      document={(() => {
                                        const { extracted_items, ...bidDoc } = doc
                                        return bidDoc as BidDocument
                                      })()}
                                    />
                                  </TableCell>
                                )
                              })}
                            </TableRow>
                          )
                        })}
                    </Fragment>
                    )
                  })
                })()
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
            <Shield className="h-4 w-4" />
            <span>Quality score</span>
          </div>
          <div className="flex items-center gap-1 text-violet-600">
            <Target className="h-4 w-4" />
            <span>Baseline qty</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Scale className="h-4 w-4" />
            <span>Bid leveling</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Pencil className="h-4 w-4" />
            <span>Hover to edit</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <FileText className="h-4 w-4" />
            <span>View in document</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
