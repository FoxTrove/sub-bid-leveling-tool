"use client"

import { useState } from "react"
import { Pencil, CheckCircle2, XCircle, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { formatCurrency } from "@/lib/utils/format"
import { CorrectionModal } from "./correction-modal"
import type { ExtractedItem } from "@/types"

export interface CellData {
  price: number | null
  isExclusion: boolean
  confidence: number
  originalDescription: string
  itemId?: string
}

export interface CorrectionInput {
  itemId: string
  documentId: string
  projectId: string
  tradeType: string
  correctionType: 'description' | 'category' | 'price' | 'exclusion_flag' | 'quantity' | 'unit'
  originalValue: Record<string, unknown>
  correctedValue: Record<string, unknown>
  rawText?: string
  aiNotes?: string
  confidenceScore?: number
  needsReview?: boolean
}

interface EditableCellProps {
  data: CellData | undefined
  documentId: string
  projectId: string
  tradeType: string
  documentType: string
  normalizedDescription: string
  category: string
  userOptedIn: boolean
  onCorrection?: (correction: CorrectionInput) => void
  // Full item for correction modal
  fullItem?: ExtractedItem
}

export function EditableCell({
  data,
  documentId,
  projectId,
  tradeType,
  documentType,
  normalizedDescription,
  category,
  userOptedIn,
  onCorrection,
  fullItem,
}: EditableCellProps) {
  const [showEditModal, setShowEditModal] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  // Not mentioned state
  if (!data) {
    return (
      <div className="flex items-center justify-center gap-1 text-muted-foreground">
        <HelpCircle className="h-4 w-4" />
        <span className="text-sm">Not mentioned</span>
      </div>
    )
  }

  // Excluded state
  if (data.isExclusion) {
    return (
      <div
        className="group relative flex items-center justify-center gap-1 text-red-600"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <XCircle className="h-4 w-4" />
        <span className="text-sm">Excluded</span>
        {fullItem && (
          <EditButton
            visible={isHovered}
            onClick={() => setShowEditModal(true)}
          />
        )}

        {showEditModal && fullItem && (
          <CorrectionModal
            item={fullItem}
            documentId={documentId}
            projectId={projectId}
            tradeType={tradeType}
            documentType={documentType}
            normalizedDescription={normalizedDescription}
            category={category}
            userOptedIn={userOptedIn}
            onClose={() => setShowEditModal(false)}
            onSave={(correction) => {
              onCorrection?.(correction)
              setShowEditModal(false)
            }}
          />
        )}
      </div>
    )
  }

  // Included state with price
  return (
    <div
      className="group relative flex flex-col items-center"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center gap-1 text-green-600">
        <CheckCircle2 className="h-4 w-4" />
        <span className="font-medium">{formatCurrency(data.price)}</span>
      </div>
      {data.confidence < 0.8 && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <span className="text-xs text-amber-600">Low confidence</span>
            </TooltipTrigger>
            <TooltipContent>
              <p>Confidence: {Math.round(data.confidence * 100)}%</p>
              <p className="text-xs text-muted-foreground">
                Click edit to correct if needed
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {fullItem && (
        <EditButton
          visible={isHovered}
          onClick={() => setShowEditModal(true)}
        />
      )}

      {showEditModal && fullItem && (
        <CorrectionModal
          item={fullItem}
          documentId={documentId}
          projectId={projectId}
          tradeType={tradeType}
          documentType={documentType}
          normalizedDescription={normalizedDescription}
          category={category}
          userOptedIn={userOptedIn}
          onClose={() => setShowEditModal(false)}
          onSave={(correction) => {
            onCorrection?.(correction)
            setShowEditModal(false)
          }}
        />
      )}
    </div>
  )
}

function EditButton({
  visible,
  onClick,
}: {
  visible: boolean
  onClick: () => void
}) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className={`absolute -right-1 -top-1 h-6 w-6 rounded-full bg-background shadow-sm transition-opacity ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
    >
      <Pencil className="h-3 w-3" />
      <span className="sr-only">Edit</span>
    </Button>
  )
}
