"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ChevronDown, ChevronRight, CheckCircle2, XCircle, AlertTriangle, Trophy } from "lucide-react"
import { formatCurrency } from "@/lib/utils/format"
import type { ComparisonResult, BidDocumentWithItems, ExtractedItem } from "@/types"

interface ContractorDetailCardsProps {
  documents: BidDocumentWithItems[]
  results: ComparisonResult
}

export function ContractorDetailCards({ documents, results }: ContractorDetailCardsProps) {
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())

  const toggleCard = (id: string) => {
    const newExpanded = new Set(expandedCards)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedCards(newExpanded)
  }

  const expandAll = () => {
    setExpandedCards(new Set(documents.map(d => d.id)))
  }

  const collapseAll = () => {
    setExpandedCards(new Set())
  }

  const summary = results.summary_json
  const recommendation = results.recommendation_json

  // Group items by category for each contractor
  const getContractorBreakdown = (doc: BidDocumentWithItems) => {
    const items = doc.extracted_items || []
    const contractorSummary = summary.contractors.find(c => c.id === doc.id)

    // Separate inclusions and exclusions
    const inclusions = items.filter(i => !i.is_exclusion)
    const exclusions = items.filter(i => i.is_exclusion)

    // Group inclusions by category
    const byCategory = new Map<string, ExtractedItem[]>()
    for (const item of inclusions) {
      const cat = item.category || "General"
      if (!byCategory.has(cat)) {
        byCategory.set(cat, [])
      }
      byCategory.get(cat)!.push(item)
    }

    // Calculate totals
    const baseTotal = inclusions.reduce((sum, i) => sum + (i.total_price || 0), 0)
    const exclusionsTotal = exclusions.reduce((sum, i) => sum + (i.total_price || 0), 0)

    return {
      inclusions,
      exclusions,
      byCategory: Array.from(byCategory.entries()).sort((a, b) => a[0].localeCompare(b[0])),
      baseTotal,
      exclusionsTotal,
      itemCount: items.length,
      confidence: contractorSummary?.confidence_avg || 0,
      isRecommended: recommendation.recommended_contractor_id === doc.id,
    }
  }

  // Sort contractors by base bid (lowest first)
  const sortedDocs = [...documents].sort((a, b) => {
    const aBreakdown = getContractorBreakdown(a)
    const bBreakdown = getContractorBreakdown(b)
    return aBreakdown.baseTotal - bBreakdown.baseTotal
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Detailed Contractor Breakdown</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={expandAll}>
            Expand All
          </Button>
          <Button variant="outline" size="sm" onClick={collapseAll}>
            Collapse All
          </Button>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Standardized breakdown of each bid for apples-to-apples comparison. Review exclusions carefully as they affect true cost.
      </p>

      {sortedDocs.map((doc, index) => {
        const breakdown = getContractorBreakdown(doc)
        const isExpanded = expandedCards.has(doc.id)

        return (
          <Card
            key={doc.id}
            className={`${breakdown.isRecommended ? "border-green-300 bg-green-50/30" : ""}`}
          >
            <Collapsible open={isExpanded} onOpenChange={() => toggleCard(doc.id)}>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="h-5 w-5" />
                      ) : (
                        <ChevronRight className="h-5 w-5" />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{doc.contractor_name}</CardTitle>
                          {breakdown.isRecommended && (
                            <Badge className="bg-green-600">
                              <Trophy className="mr-1 h-3 w-3" />
                              Recommended
                            </Badge>
                          )}
                          {index === 0 && !breakdown.isRecommended && (
                            <Badge variant="outline">Lowest Base</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {breakdown.itemCount} line items | {breakdown.exclusions.length} exclusions
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-2xl font-bold">
                        {formatCurrency(breakdown.baseTotal)}
                      </p>
                      {breakdown.exclusionsTotal > 0 && (
                        <p className="text-sm text-amber-600">
                          +{formatCurrency(breakdown.exclusionsTotal)} potential adds
                        </p>
                      )}
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <CardContent className="border-t pt-4">
                  <div className="space-y-6">
                    {/* Summary Stats */}
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                      <div className="rounded-lg bg-muted/50 p-3">
                        <p className="text-xs text-muted-foreground">Base Bid Total</p>
                        <p className="text-lg font-semibold">{formatCurrency(breakdown.baseTotal)}</p>
                      </div>
                      <div className="rounded-lg bg-muted/50 p-3">
                        <p className="text-xs text-muted-foreground">Included Items</p>
                        <p className="text-lg font-semibold">{breakdown.inclusions.length}</p>
                      </div>
                      <div className="rounded-lg bg-amber-50 p-3">
                        <p className="text-xs text-amber-700">Exclusions</p>
                        <p className="text-lg font-semibold text-amber-700">{breakdown.exclusions.length}</p>
                      </div>
                      <div className="rounded-lg bg-muted/50 p-3">
                        <p className="text-xs text-muted-foreground">Extraction Confidence</p>
                        <p className="text-lg font-semibold">{(breakdown.confidence * 100).toFixed(0)}%</p>
                      </div>
                    </div>

                    {/* Exclusions Section - Always show prominently */}
                    {breakdown.exclusions.length > 0 && (
                      <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4">
                        <div className="mb-3 flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-amber-600" />
                          <h4 className="font-semibold text-amber-800">Exclusions (Not Included in Base Bid)</h4>
                        </div>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Item</TableHead>
                              <TableHead className="text-right">Est. Value</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {breakdown.exclusions.map((item, i) => (
                              <TableRow key={i}>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <XCircle className="h-4 w-4 text-red-500" />
                                    <span>{item.description}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">
                                  {item.total_price != null ? formatCurrency(item.total_price) : "TBD"}
                                </TableCell>
                              </TableRow>
                            ))}
                            <TableRow className="bg-amber-100/50 font-medium">
                              <TableCell>Total Exclusions Value</TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(breakdown.exclusionsTotal)}
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    )}

                    {/* Included Items by Category */}
                    <div>
                      <div className="mb-3 flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        <h4 className="font-semibold">Included Items by Category</h4>
                      </div>

                      {breakdown.byCategory.map(([category, items]) => (
                        <div key={category} className="mb-4">
                          <div className="mb-2 flex items-center justify-between border-b pb-1">
                            <span className="font-medium text-muted-foreground">{category}</span>
                            <span className="text-sm">
                              {formatCurrency(items.reduce((sum, i) => sum + (i.total_price || 0), 0))}
                            </span>
                          </div>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-[50%]">Description</TableHead>
                                <TableHead>Qty</TableHead>
                                <TableHead>Unit</TableHead>
                                <TableHead className="text-right">Unit Price</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {items.map((item, i) => (
                                <TableRow key={i}>
                                  <TableCell className="font-medium">{item.description}</TableCell>
                                  <TableCell>{item.quantity || "-"}</TableCell>
                                  <TableCell>{item.unit || "-"}</TableCell>
                                  <TableCell className="text-right">
                                    {item.unit_price ? formatCurrency(item.unit_price) : "-"}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {formatCurrency(item.total_price)}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      ))}
                    </div>

                    {/* Bottom Summary */}
                    <div className="rounded-lg bg-muted p-4">
                      <div className="flex justify-between text-sm">
                        <span>Base Bid Subtotal:</span>
                        <span className="font-medium">{formatCurrency(breakdown.baseTotal)}</span>
                      </div>
                      {breakdown.exclusionsTotal > 0 && (
                        <div className="mt-1 flex justify-between text-sm text-amber-700">
                          <span>Potential Exclusion Add-ons:</span>
                          <span className="font-medium">+{formatCurrency(breakdown.exclusionsTotal)}</span>
                        </div>
                      )}
                      <div className="mt-2 flex justify-between border-t pt-2 text-lg font-bold">
                        <span>Estimated True Cost:</span>
                        <span>{formatCurrency(breakdown.baseTotal + breakdown.exclusionsTotal)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        )
      })}
    </div>
  )
}
