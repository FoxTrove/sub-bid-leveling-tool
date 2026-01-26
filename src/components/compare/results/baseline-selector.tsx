"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Target, Check, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface BaselineSelectorProps {
  itemDescription: string
  contractorId: string
  contractorName: string
  quantity: number | null
  unit: string | null
  isBaseline: boolean
  onSetBaseline: (
    itemDescription: string,
    contractorId: string,
    quantity: number,
    unit: string
  ) => void
  onClearBaseline: (itemDescription: string) => void
  disabled?: boolean
}

export function BaselineSelector({
  itemDescription,
  contractorId,
  contractorName,
  quantity,
  unit,
  isBaseline,
  onSetBaseline,
  onClearBaseline,
  disabled = false,
}: BaselineSelectorProps) {
  const [isHovered, setIsHovered] = useState(false)

  // Can only set baseline if item has quantity
  const canSetBaseline = quantity != null && quantity > 0

  if (isBaseline) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 bg-violet-100 text-violet-700 hover:bg-red-100 hover:text-red-700"
              onClick={() => onClearBaseline(itemDescription)}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              disabled={disabled}
            >
              {isHovered ? (
                <X className="h-3.5 w-3.5" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>{isHovered ? "Remove as baseline" : "Baseline quantity"}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  if (!canSetBaseline) {
    return null
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-violet-700 hover:bg-violet-100"
            onClick={() =>
              onSetBaseline(itemDescription, contractorId, quantity, unit || "EA")
            }
            disabled={disabled}
          >
            <Target className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>
            Use {contractorName}&apos;s quantity ({quantity} {unit}) as baseline
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// Inline version for use in table cells
interface InlineBaselineSelectorProps {
  isBaseline: boolean
  canSetBaseline: boolean
  onSetBaseline: () => void
  onClearBaseline: () => void
  contractorName: string
  quantity: number | null
  unit: string | null
  disabled?: boolean
}

export function InlineBaselineSelector({
  isBaseline,
  canSetBaseline,
  onSetBaseline,
  onClearBaseline,
  contractorName,
  quantity,
  unit,
  disabled = false,
}: InlineBaselineSelectorProps) {
  const [isHovered, setIsHovered] = useState(false)

  if (isBaseline) {
    return (
      <button
        className={cn(
          "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium transition-colors",
          isHovered
            ? "bg-red-100 text-red-700"
            : "bg-violet-100 text-violet-700"
        )}
        onClick={onClearBaseline}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        disabled={disabled}
        title={isHovered ? "Remove baseline" : "Baseline"}
      >
        {isHovered ? (
          <X className="h-3 w-3" />
        ) : (
          <Target className="h-3 w-3" />
        )}
        <span>{isHovered ? "Clear" : "Baseline"}</span>
      </button>
    )
  }

  if (!canSetBaseline) {
    return null
  }

  return (
    <button
      className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:bg-violet-100 hover:text-violet-700"
      onClick={onSetBaseline}
      disabled={disabled}
      title={`Use ${contractorName}'s quantity (${quantity} ${unit}) as baseline`}
    >
      <Target className="h-3 w-3" />
      <span>Set baseline</span>
    </button>
  )
}
