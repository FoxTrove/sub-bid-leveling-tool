"use client"

import { useState, useEffect } from "react"
import {
  Loader2,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Check,
  LayoutGrid,
  RefreshCw,
  Star,
  Ban,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"
import type {
  BreakdownStructure,
  BreakdownStructureNode,
  BreakdownTemplate,
  BreakdownSource,
  BreakdownType,
} from "@/types"

interface BreakdownOption {
  id: string
  type: BreakdownType
  structure: BreakdownStructure
  confidence: number
  explanation: string | null
  isRecommended: boolean
}

interface BreakdownSelectionStepProps {
  tradeType: string
  projectId?: string // If provided, can generate AI options
  onSelectionChange: (selection: {
    structure: BreakdownStructure | null
    source: BreakdownSource | null
    templateId?: string
  }) => void
  selectedBreakdown: BreakdownStructure | null
  selectedSource: BreakdownSource | null
}

export function BreakdownSelectionStep({
  tradeType,
  projectId,
  onSelectionChange,
  selectedBreakdown,
  selectedSource,
}: BreakdownSelectionStepProps) {
  const [templates, setTemplates] = useState<BreakdownTemplate[]>([])
  const [aiOptions, setAiOptions] = useState<BreakdownOption[]>([])
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true)
  const [isLoadingAi, setIsLoadingAi] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null
  )

  // Load templates for this trade type
  useEffect(() => {
    async function loadTemplates() {
      setIsLoadingTemplates(true)
      try {
        const response = await fetch(
          `/api/breakdown-templates?trade_type=${encodeURIComponent(tradeType)}`
        )
        if (response.ok) {
          const data = await response.json()
          setTemplates(data.templates || [])
        }
      } catch (err) {
        console.error("Failed to load templates:", err)
      } finally {
        setIsLoadingTemplates(false)
      }
    }

    if (tradeType) {
      loadTemplates()
    }
  }, [tradeType])

  // Load AI-generated options if project has documents
  useEffect(() => {
    async function loadAiOptions() {
      if (!projectId) return

      setIsLoadingAi(true)
      setAiError(null)

      try {
        const response = await fetch(
          `/api/projects/${projectId}/breakdown/generate`,
          { method: "POST" }
        )

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || "Failed to generate breakdown options")
        }

        const data = await response.json()
        setAiOptions(data.options || [])

        // Auto-select recommended option if none selected
        if (!selectedOptionId && !selectedTemplateId) {
          const recommended = data.options.find(
            (o: BreakdownOption) => o.isRecommended
          )
          if (recommended) {
            handleSelectAiOption(recommended)
          }
        }
      } catch (err) {
        console.error("Failed to load AI options:", err)
        setAiError(err instanceof Error ? err.message : "Unknown error")
      } finally {
        setIsLoadingAi(false)
      }
    }

    if (projectId) {
      loadAiOptions()
    }
  }, [projectId])

  const handleSelectAiOption = (option: BreakdownOption) => {
    setSelectedOptionId(option.id)
    setSelectedTemplateId(null)
    onSelectionChange({
      structure: option.structure,
      source: "ai",
    })
  }

  const handleSelectTemplate = (template: BreakdownTemplate) => {
    setSelectedOptionId(null)
    setSelectedTemplateId(template.id)
    onSelectionChange({
      structure: template.breakdown_structure,
      source: "template",
      templateId: template.id,
    })
  }

  const handleSkip = () => {
    setSelectedOptionId(null)
    setSelectedTemplateId(null)
    onSelectionChange({
      structure: null,
      source: null,
    })
  }

  const handleRefreshAi = async () => {
    if (!projectId) return

    setIsLoadingAi(true)
    setAiError(null)

    try {
      // Delete cached options
      await fetch(`/api/projects/${projectId}/breakdown/generate`, {
        method: "DELETE",
      })

      // Generate new options
      const response = await fetch(
        `/api/projects/${projectId}/breakdown/generate`,
        { method: "POST" }
      )

      if (!response.ok) {
        throw new Error("Failed to regenerate options")
      }

      const data = await response.json()
      setAiOptions(data.options || [])
      setSelectedOptionId(null)
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setIsLoadingAi(false)
    }
  }

  const isNoBreakdownSelected =
    selectedSource === null && !selectedOptionId && !selectedTemplateId

  // Show loading state while fetching AI options
  if (projectId && isLoadingAi && aiOptions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-16 w-16 rounded-full bg-gradient-to-r from-violet-500 to-purple-600 opacity-20 animate-ping" />
          </div>
          <Sparkles className="relative h-8 w-8 text-violet-600 animate-pulse" />
        </div>
        <p className="mt-4 font-medium">Analyzing your documents...</p>
        <p className="mt-1 text-sm text-muted-foreground">
          AI is finding the best way to organize your comparison
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Introduction */}
      <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-950/30">
        <div className="flex gap-3">
          <LayoutGrid className="h-5 w-5 shrink-0 text-blue-600" />
          <div>
            <p className="font-medium text-blue-900 dark:text-blue-100">
              How should scope items be organized?
            </p>
            <p className="mt-1 text-sm text-blue-800 dark:text-blue-200">
              {projectId
                ? "Select one of the AI-suggested groupings below, or skip to extract items without categorization."
                : "Choose how to group extracted items for comparison. AI will suggest the best grouping based on your documents, or you can use a saved template."}
            </p>
          </div>
        </div>
      </div>

      {/* AI-Generated Options (shown as columns when projectId is available) */}
      {projectId && aiOptions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium text-muted-foreground">
              AI-Suggested Options
            </Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefreshAi}
              disabled={isLoadingAi}
              className="h-7 text-xs"
            >
              <RefreshCw
                className={cn("mr-1 h-3 w-3", isLoadingAi && "animate-spin")}
              />
              Regenerate
            </Button>
          </div>

          {/* Options displayed in columns */}
          <div className="grid gap-4 md:grid-cols-3">
            {aiOptions.slice(0, 3).map((option) => (
              <AiOptionCard
                key={option.id}
                option={option}
                isSelected={selectedOptionId === option.id}
                onSelect={() => handleSelectAiOption(option)}
              />
            ))}
          </div>
        </div>
      )}

      {/* AI Error State */}
      {projectId && aiError && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:bg-amber-950/30">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            {aiError}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshAi}
            className="mt-2"
          >
            <RefreshCw className="mr-2 h-3 w-3" />
            Try Again
          </Button>
        </div>
      )}

      {/* Legacy AI-Powered Option (when no projectId) */}
      {!projectId && (
        <div className="space-y-3">
          <Label className="text-sm font-medium text-muted-foreground">
            Recommended
          </Label>
          <button
            onClick={() => {
              setSelectedOptionId(null)
              setSelectedTemplateId(null)
              onSelectionChange({
                structure: null,
                source: "ai",
              })
            }}
            className={cn(
              "w-full rounded-lg border p-4 text-left transition-colors",
              selectedSource === "ai" && !selectedTemplateId
                ? "border-primary bg-primary/5"
                : "hover:border-muted-foreground/50"
            )}
          >
            <div className="flex items-start justify-between">
              <div className="flex gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 text-white">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">AI-Powered Breakdown</span>
                    <Badge variant="secondary" className="text-xs">
                      Recommended
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    AI analyzes your bid documents and suggests the best
                    grouping strategy. You&apos;ll review options after documents
                    are processed.
                  </p>
                </div>
              </div>
              {selectedSource === "ai" && !selectedTemplateId && (
                <Check className="h-5 w-5 shrink-0 text-primary" />
              )}
            </div>
          </button>
        </div>
      )}

      {/* Templates Section */}
      {templates.length > 0 && (
        <div className="space-y-3">
          <Label className="text-sm font-medium text-muted-foreground">
            Your Saved Templates for {tradeType}
          </Label>
          <div className="grid gap-3 sm:grid-cols-2">
            {templates.map((template) => (
              <BreakdownTemplateCard
                key={template.id}
                template={template}
                isSelected={selectedTemplateId === template.id}
                onSelect={() => handleSelectTemplate(template)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Skip Option */}
      <div className="border-t pt-4">
        <button
          onClick={handleSkip}
          className={cn(
            "w-full rounded-lg border border-dashed p-4 text-left transition-colors hover:bg-muted/50",
            isNoBreakdownSelected && "border-primary bg-primary/5"
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Ban className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Skip - Extract Without Categories</p>
                <p className="text-sm text-muted-foreground">
                  Extract items as a flat list. You can organize them later.
                </p>
              </div>
            </div>
            {isNoBreakdownSelected && (
              <Check className="h-5 w-5 text-primary" />
            )}
          </div>
        </button>
      </div>
    </div>
  )
}

// ============================================
// AI Option Card Component (New Column Design)
// ============================================

interface AiOptionCardProps {
  option: BreakdownOption
  isSelected: boolean
  onSelect: () => void
}

function AiOptionCard({ option, isSelected, onSelect }: AiOptionCardProps) {
  const confidencePercent = Math.round(option.confidence * 100)

  // Format the breakdown type for display
  const typeLabel = formatBreakdownType(option.type)

  return (
    <button
      onClick={onSelect}
      className={cn(
        "flex flex-col rounded-lg border p-4 text-left transition-all",
        isSelected
          ? "border-primary bg-primary/5 ring-2 ring-primary ring-offset-2"
          : "hover:border-muted-foreground/50 hover:shadow-md"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold">{typeLabel}</span>
            {option.isRecommended && (
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            )}
          </div>
          {option.isRecommended && (
            <Badge variant="secondary" className="mt-1 text-xs">
              Recommended
            </Badge>
          )}
        </div>
        {isSelected && <Check className="h-5 w-5 text-primary" />}
      </div>

      {/* Category Preview */}
      <div className="mt-3 flex-1">
        <ul className="space-y-1 text-sm text-muted-foreground">
          {option.structure.nodes.slice(0, 5).map((node) => (
            <li key={node.id} className="flex items-center gap-1.5">
              <span className="text-muted-foreground/50">&bull;</span>
              <span className="truncate">{node.name}</span>
            </li>
          ))}
          {option.structure.nodes.length > 5 && (
            <li className="text-xs text-muted-foreground/70">
              +{option.structure.nodes.length - 5} more categories
            </li>
          )}
        </ul>
      </div>

      {/* Confidence Score */}
      <div className="mt-3 flex items-center justify-between border-t pt-3">
        <span className="text-xs text-muted-foreground">Confidence</span>
        <div className="flex items-center gap-1.5">
          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full",
                confidencePercent >= 80
                  ? "bg-green-500"
                  : confidencePercent >= 60
                    ? "bg-amber-500"
                    : "bg-red-500"
              )}
              style={{ width: `${confidencePercent}%` }}
            />
          </div>
          <span className="text-xs font-mono">{confidencePercent}%</span>
        </div>
      </div>
    </button>
  )
}

// ============================================
// Breakdown Template Card Component
// ============================================

interface BreakdownTemplateCardProps {
  template: BreakdownTemplate
  isSelected: boolean
  onSelect: () => void
}

function BreakdownTemplateCard({
  template,
  isSelected,
  onSelect,
}: BreakdownTemplateCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div
      className={cn(
        "rounded-lg border p-3 transition-colors cursor-pointer",
        isSelected
          ? "border-primary bg-primary/5"
          : "hover:border-muted-foreground/50"
      )}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{template.name}</p>
          {template.description && (
            <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
              {template.description}
            </p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            Used {template.use_count} time{template.use_count !== 1 ? "s" : ""}
          </p>
        </div>
        {isSelected && <Check className="h-5 w-5 shrink-0 text-primary ml-2" />}
      </div>

      {/* Expandable Preview */}
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger
          className="mt-2 flex items-center text-xs text-muted-foreground hover:text-foreground"
          onClick={(e) => e.stopPropagation()}
        >
          {isExpanded ? (
            <ChevronDown className="mr-1 h-3 w-3" />
          ) : (
            <ChevronRight className="mr-1 h-3 w-3" />
          )}
          Preview ({template.breakdown_structure.nodes.length} categories)
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2">
          <div
            className="rounded bg-muted/50 p-2 text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <BreakdownTreePreview nodes={template.breakdown_structure.nodes} />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}

// ============================================
// Tree Preview Component
// ============================================

interface BreakdownTreePreviewProps {
  nodes: BreakdownStructureNode[]
  depth?: number
}

function BreakdownTreePreview({ nodes, depth = 0 }: BreakdownTreePreviewProps) {
  if (depth > 2) return null // Max 2 levels deep for preview

  return (
    <ul className="space-y-0.5">
      {nodes.slice(0, depth === 0 ? 8 : 4).map((node) => (
        <li key={node.id} style={{ marginLeft: depth * 12 }}>
          <span className="text-muted-foreground">
            {depth > 0 ? "└ " : "• "}
          </span>
          <span>{node.name}</span>
          {node.children && node.children.length > 0 && (
            <BreakdownTreePreview nodes={node.children} depth={depth + 1} />
          )}
        </li>
      ))}
      {nodes.length > (depth === 0 ? 8 : 4) && (
        <li
          style={{ marginLeft: depth * 12 }}
          className="text-muted-foreground"
        >
          ... and {nodes.length - (depth === 0 ? 8 : 4)} more
        </li>
      )}
    </ul>
  )
}

// ============================================
// Helper Functions
// ============================================

function formatBreakdownType(type: BreakdownType): string {
  const typeLabels: Record<BreakdownType, string> = {
    by_location: "By Location",
    by_material: "By Material",
    by_phase: "By Phase",
    by_unit: "By Unit",
    by_system: "By System",
    by_floor: "By Floor",
    by_area: "By Area",
    custom: "Custom",
  }
  return typeLabels[type] || type
}
