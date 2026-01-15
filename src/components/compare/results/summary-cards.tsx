import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { DollarSign, FileStack, AlertTriangle, Users, Info } from "lucide-react"
import { formatCurrency } from "@/lib/utils/format"
import { METRIC_TOOLTIPS } from "@/lib/utils/constants"
import type { ComparisonResult, BidDocument } from "@/types"

interface SummaryCardsProps {
  results: ComparisonResult
  documents: BidDocument[]
}

export function SummaryCards({ results, documents }: SummaryCardsProps) {
  const cards = [
    {
      title: "Bids Compared",
      value: results.total_bids.toString(),
      subtitle: documents.map((d) => d.contractor_name).join(", "),
      icon: Users,
      tooltip: METRIC_TOOLTIPS.bidsCompared,
    },
    {
      title: "Price Range",
      value:
        results.price_low && results.price_high
          ? `${formatCurrency(results.price_low)} - ${formatCurrency(results.price_high)}`
          : "N/A",
      subtitle: results.price_average
        ? `Avg: ${formatCurrency(results.price_average)}`
        : undefined,
      icon: DollarSign,
      tooltip: METRIC_TOOLTIPS.priceRange,
    },
    {
      title: "Scope Items",
      value: results.total_scope_items.toString(),
      subtitle: `${results.common_items} common, ${results.gap_items} gaps`,
      icon: FileStack,
      tooltip: METRIC_TOOLTIPS.scopeItems,
    },
    {
      title: "Scope Gaps",
      value: results.gap_items.toString(),
      subtitle: "Items missing from at least one bid",
      icon: AlertTriangle,
      highlight: results.gap_items > 0,
      tooltip: METRIC_TOOLTIPS.scopeGaps,
    },
  ]

  return (
    <TooltipProvider>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card
            key={card.title}
            className={card.highlight ? "border-amber-200 bg-amber-50/50" : ""}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-1">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <p className="text-sm">{card.tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <card.icon
                className={`h-4 w-4 ${card.highlight ? "text-amber-600" : "text-muted-foreground"}`}
              />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              {card.subtitle && (
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {card.subtitle}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </TooltipProvider>
  )
}
