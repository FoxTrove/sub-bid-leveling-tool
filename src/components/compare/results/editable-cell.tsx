"use client"

import { useState, useCallback } from "react"
import { Pencil, CheckCircle2, XCircle, HelpCircle, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { formatCurrency } from "@/lib/utils/format"
import { CorrectionModal } from "./correction-modal"
import { useDocumentViewer } from "@/contexts/document-viewer-context"
import type { ExtractedItem, TextPosition, BidDocument } from "@/types"

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
  // Document for document viewer
  document?: BidDocument
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
  document,
}: EditableCellProps) {
  const [showEditModal, setShowEditModal] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  // Document viewer integration
  const {
    isOpen: isViewerOpen,
    openPanel,
    setActiveDocument,
    highlightItemInDocument,
  } = useDocumentViewer()

  // Handle viewing item in document
  const handleViewInDocument = useCallback(() => {
    if (!fullItem || !document) return

    // Open the document viewer if not already open
    if (!isViewerOpen) {
      openPanel()
    }

    // Set the active document
    setActiveDocument(document)

    // Highlight the item in the document
    if (fullItem.text_position) {
      highlightItemInDocument(fullItem, documentId)
    }
  }, [fullItem, document, isViewerOpen, openPanel, setActiveDocument, highlightItemInDocument, documentId])

  // Check if this item has position data for document viewing
  const hasPositionData = fullItem?.text_position != null

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
        {hasPositionData && document && (
          <ViewDocumentButton
            visible={isHovered}
            onClick={handleViewInDocument}
          />
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

      {hasPositionData && document && (
        <ViewDocumentButton
          visible={isHovered}
          onClick={handleViewInDocument}
        />
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

function ViewDocumentButton({
  visible,
  onClick,
}: {
  visible: boolean
  onClick: () => void
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={`absolute -left-1 -top-1 h-6 w-6 rounded-full bg-background shadow-sm transition-opacity ${
              visible ? "opacity-100" : "opacity-0"
            }`}
            onClick={(e) => {
              e.stopPropagation()
              onClick()
            }}
          >
            <FileText className="h-3 w-3" />
            <span className="sr-only">View in document</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>View in document</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
