"use client"

import { useMemo, useState } from "react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  DollarSign,
  Package,
  Search,
  HelpCircle,
  FileQuestion,
  Info,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { BidQualityAnalysis, RedFlag, RedFlagType } from "@/types"

interface BidQualityBadgeProps {
  analysis: BidQualityAnalysis | null
  contractorName: string
  compact?: boolean
}

export function BidQualityBadge({
  analysis,
  contractorName,
  compact = false,
}: BidQualityBadgeProps) {
  const [isOpen, setIsOpen] = useState(false)

  if (!analysis) {
    return null
  }

  const { completenessScore, riskLevel, redFlags, factors } = analysis

  const riskColors = getRiskLevelColors(riskLevel)
  const criticalFlags = redFlags.filter((f) => f.severity === "critical")
  const warningFlags = redFlags.filter((f) => f.severity === "warning")

  // Compact mode - just show score with tooltip
  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="outline"
              className={cn(
                "font-mono text-xs cursor-default",
                riskColors.bg,
                riskColors.text,
                riskColors.border
              )}
            >
              {completenessScore}
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <div className="space-y-1">
              <div className="font-medium">
                Quality Score: {completenessScore}/100
              </div>
              {redFlags.length > 0 && (
                <div className="text-xs text-muted-foreground">
                  {criticalFlags.length > 0 && (
                    <span className="text-red-600">
                      {criticalFlags.length} critical issue
                      {criticalFlags.length !== 1 ? "s" : ""}
                    </span>
                  )}
                  {criticalFlags.length > 0 && warningFlags.length > 0 && ", "}
                  {warningFlags.length > 0 && (
                    <span className="text-amber-600">
                      {warningFlags.length} warning
                      {warningFlags.length !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  // Full mode - expandable popover
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-7 gap-1.5 px-2",
            riskColors.bg,
            riskColors.text,
            "hover:opacity-80"
          )}
        >
          {riskLevel === "high" ? (
            <AlertCircle className="h-3.5 w-3.5" />
          ) : riskLevel === "medium" ? (
            <AlertTriangle className="h-3.5 w-3.5" />
          ) : (
            <CheckCircle2 className="h-3.5 w-3.5" />
          )}
          <span className="font-mono text-xs">{completenessScore}</span>
          <ChevronDown className="h-3 w-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-4">
          {/* Header */}
          <div>
            <h4 className="font-semibold">{contractorName}</h4>
            <p className="text-sm text-muted-foreground">
              Quality Score: {completenessScore}/100
            </p>
          </div>

          {/* Score breakdown */}
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground">
              Score Breakdown
            </div>
            <ScoreBar
              label="Line Item Detail"
              score={factors.lineItemDetailScore}
              maxScore={30}
            />
            <ScoreBar
              label="Exclusions Clarity"
              score={factors.exclusionsClarityScore}
              maxScore={20}
            />
            <ScoreBar
              label="Scope Coverage"
              score={factors.scopeCoverageScore}
              maxScore={30}
            />
            <ScoreBar
              label="Pricing Completeness"
              score={factors.pricingCompletenessScore}
              maxScore={20}
            />
          </div>

          {/* Red flags */}
          {redFlags.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground">
                Issues Detected ({redFlags.length})
              </div>
              <div className="space-y-2">
                {redFlags.map((flag, index) => (
                  <RedFlagItem key={index} flag={flag} />
                ))}
              </div>
            </div>
          )}

          {/* Risk level summary */}
          <div
            className={cn(
              "rounded-lg p-3",
              riskColors.bg,
              "border",
              riskColors.border
            )}
          >
            <div className="flex items-start gap-2">
              <Info className={cn("h-4 w-4 mt-0.5", riskColors.text)} />
              <div>
                <div className={cn("text-sm font-medium", riskColors.text)}>
                  {riskLevel === "high"
                    ? "High Risk"
                    : riskLevel === "medium"
                      ? "Medium Risk"
                      : "Low Risk"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {getRiskLevelDescription(riskLevel)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

// ============================================
// HELPER COMPONENTS
// ============================================

function ScoreBar({
  label,
  score,
  maxScore,
}: {
  label: string
  score: number
  maxScore: number
}) {
  const percentage = (score / maxScore) * 100

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span>{label}</span>
        <span className="font-mono text-muted-foreground">
          {score}/{maxScore}
        </span>
      </div>
      <Progress value={percentage} className="h-1.5" />
    </div>
  )
}

function RedFlagItem({ flag }: { flag: RedFlag }) {
  const Icon = getRedFlagIconComponent(flag.type)

  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-md p-2 text-xs",
        flag.severity === "critical"
          ? "bg-red-50 text-red-700"
          : "bg-amber-50 text-amber-700"
      )}
    >
      <Icon className="h-3.5 w-3.5 mt-0.5 shrink-0" />
      <div>
        <div>{flag.description}</div>
        {flag.affectedItems && flag.affectedItems.length > 0 && (
          <div className="mt-1 text-[10px] opacity-80">
            Items: {flag.affectedItems.slice(0, 3).join(", ")}
            {flag.affectedItems.length > 3 &&
              ` (+${flag.affectedItems.length - 3} more)`}
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function getRiskLevelColors(riskLevel: "low" | "medium" | "high") {
  switch (riskLevel) {
    case "low":
      return {
        bg: "bg-green-50",
        text: "text-green-700",
        border: "border-green-200",
      }
    case "medium":
      return {
        bg: "bg-amber-50",
        text: "text-amber-700",
        border: "border-amber-200",
      }
    case "high":
      return {
        bg: "bg-red-50",
        text: "text-red-700",
        border: "border-red-200",
      }
  }
}

function getRiskLevelDescription(riskLevel: "low" | "medium" | "high") {
  switch (riskLevel) {
    case "low":
      return "This bid appears complete and well-documented."
    case "medium":
      return "This bid has some issues that may warrant clarification."
    case "high":
      return "This bid has significant concerns that require careful review."
  }
}

function getRedFlagIconComponent(type: RedFlagType) {
  switch (type) {
    case "price_outlier_low":
    case "price_outlier_high":
      return DollarSign
    case "excessive_lump_sums":
      return Package
    case "excessive_allowances":
      return AlertCircle
    case "missing_expected_items":
      return Search
    case "low_extraction_confidence":
      return HelpCircle
    case "vague_descriptions":
      return FileQuestion
    default:
      return AlertTriangle
  }
}
