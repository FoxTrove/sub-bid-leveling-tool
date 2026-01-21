"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, ArrowRight, Loader2 } from "lucide-react"
import { formatCurrency } from "@/lib/utils/format"
import type { ExtractedItem } from "@/types"
import type { CorrectionInput } from "./editable-cell"

interface CorrectionModalProps {
  item: ExtractedItem
  documentId: string
  projectId: string
  tradeType: string
  documentType: string
  normalizedDescription: string
  category: string
  userOptedIn: boolean
  onClose: () => void
  onSave: (correction: CorrectionInput) => void
}

const CATEGORIES = [
  "labor",
  "materials",
  "equipment",
  "permits",
  "general_conditions",
  "overhead",
  "other",
]

export function CorrectionModal({
  item,
  documentId,
  projectId,
  tradeType,
  documentType,
  normalizedDescription,
  category,
  userOptedIn,
  onClose,
  onSave,
}: CorrectionModalProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [contributeToTraining, setContributeToTraining] = useState(userOptedIn)

  // Form state
  const [formData, setFormData] = useState({
    description: item.description,
    category: item.category || "other",
    totalPrice: item.total_price?.toString() || "",
    unitPrice: item.unit_price?.toString() || "",
    quantity: item.quantity?.toString() || "",
    unit: item.unit || "",
    isExclusion: item.is_exclusion,
  })

  // Track what changed
  const hasDescriptionChange = formData.description !== item.description
  const hasCategoryChange = formData.category !== (item.category || "other")
  const hasPriceChange =
    formData.totalPrice !== (item.total_price?.toString() || "") ||
    formData.unitPrice !== (item.unit_price?.toString() || "")
  const hasQuantityChange = formData.quantity !== (item.quantity?.toString() || "")
  const hasUnitChange = formData.unit !== (item.unit || "")
  const hasExclusionChange = formData.isExclusion !== item.is_exclusion

  const hasAnyChange =
    hasDescriptionChange ||
    hasCategoryChange ||
    hasPriceChange ||
    hasQuantityChange ||
    hasUnitChange ||
    hasExclusionChange

  const handleSave = async () => {
    if (!hasAnyChange) {
      onClose()
      return
    }

    setIsSaving(true)

    try {
      // Build the correction(s)
      const corrections: CorrectionInput[] = []

      // Description correction
      if (hasDescriptionChange) {
        corrections.push({
          itemId: item.id,
          documentId,
          projectId,
          tradeType,
          correctionType: "description",
          originalValue: {
            text: item.description,
            confidence: item.confidence_score,
          },
          correctedValue: { text: formData.description },
          rawText: item.raw_text || undefined,
          aiNotes: item.ai_notes || undefined,
          confidenceScore: item.confidence_score,
          needsReview: item.needs_review,
        })
      }

      // Category correction
      if (hasCategoryChange) {
        corrections.push({
          itemId: item.id,
          documentId,
          projectId,
          tradeType,
          correctionType: "category",
          originalValue: {
            value: item.category,
            confidence: item.confidence_score,
          },
          correctedValue: { value: formData.category },
          rawText: item.raw_text || undefined,
          confidenceScore: item.confidence_score,
          needsReview: item.needs_review,
        })
      }

      // Price correction
      if (hasPriceChange) {
        corrections.push({
          itemId: item.id,
          documentId,
          projectId,
          tradeType,
          correctionType: "price",
          originalValue: {
            total_price: item.total_price,
            unit_price: item.unit_price,
            confidence: item.confidence_score,
          },
          correctedValue: {
            total_price: formData.totalPrice ? parseFloat(formData.totalPrice) : null,
            unit_price: formData.unitPrice ? parseFloat(formData.unitPrice) : null,
          },
          rawText: item.raw_text || undefined,
          confidenceScore: item.confidence_score,
          needsReview: item.needs_review,
        })
      }

      // Quantity correction
      if (hasQuantityChange) {
        corrections.push({
          itemId: item.id,
          documentId,
          projectId,
          tradeType,
          correctionType: "quantity",
          originalValue: {
            value: item.quantity,
            confidence: item.confidence_score,
          },
          correctedValue: {
            value: formData.quantity ? parseFloat(formData.quantity) : null,
          },
          rawText: item.raw_text || undefined,
          confidenceScore: item.confidence_score,
          needsReview: item.needs_review,
        })
      }

      // Unit correction
      if (hasUnitChange) {
        corrections.push({
          itemId: item.id,
          documentId,
          projectId,
          tradeType,
          correctionType: "unit",
          originalValue: {
            value: item.unit,
            confidence: item.confidence_score,
          },
          correctedValue: { value: formData.unit },
          rawText: item.raw_text || undefined,
          confidenceScore: item.confidence_score,
          needsReview: item.needs_review,
        })
      }

      // Exclusion flag correction
      if (hasExclusionChange) {
        corrections.push({
          itemId: item.id,
          documentId,
          projectId,
          tradeType,
          correctionType: "exclusion_flag",
          originalValue: {
            value: item.is_exclusion,
            confidence: item.confidence_score,
          },
          correctedValue: { value: formData.isExclusion },
          rawText: item.raw_text || undefined,
          confidenceScore: item.confidence_score,
          needsReview: item.needs_review,
        })
      }

      // Update the extracted_items table
      const updateResponse = await fetch(`/api/items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: formData.description,
          category: formData.category,
          total_price: formData.totalPrice ? parseFloat(formData.totalPrice) : null,
          unit_price: formData.unitPrice ? parseFloat(formData.unitPrice) : null,
          quantity: formData.quantity ? parseFloat(formData.quantity) : null,
          unit: formData.unit || null,
          is_exclusion: formData.isExclusion,
          user_modified: true,
        }),
      })

      if (!updateResponse.ok) {
        throw new Error("Failed to update item")
      }

      // Submit training contributions if opted in
      if (contributeToTraining && userOptedIn) {
        for (const correction of corrections) {
          await fetch("/api/training/contribute", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              original_value: correction.originalValue,
              corrected_value: correction.correctedValue,
              trade_type: tradeType,
              document_type: documentType,
              correction_type: correction.correctionType,
              raw_text: correction.rawText,
              ai_notes: correction.aiNotes,
              confidence_score: correction.confidenceScore,
              needs_review: correction.needsReview,
            }),
          })
        }
      }

      // Pass the first correction back (for immediate UI update)
      if (corrections.length > 0) {
        onSave(corrections[0])
      } else {
        onClose()
      }
    } catch (error) {
      console.error("Failed to save correction:", error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Extracted Item</DialogTitle>
          <DialogDescription>
            Correct any errors in the AI extraction. Your changes will be saved
            to this comparison.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Original vs Current */}
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">Normalized as:</p>
            <p className="font-medium">{normalizedDescription}</p>
            <p className="text-xs text-muted-foreground">{category}</p>
          </div>

          {/* Description */}
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
            />
            {hasDescriptionChange && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="line-through">{item.description}</span>
                <ArrowRight className="h-3 w-3" />
                <span className="text-foreground">{formData.description}</span>
              </div>
            )}
          </div>

          {/* Category */}
          <div className="grid gap-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, category: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1).replace("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Price fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="totalPrice">Total Price</Label>
              <Input
                id="totalPrice"
                type="number"
                step="0.01"
                value={formData.totalPrice}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, totalPrice: e.target.value }))
                }
                placeholder="0.00"
              />
              {hasPriceChange && item.total_price && (
                <span className="text-xs text-muted-foreground">
                  Was: {formatCurrency(item.total_price)}
                </span>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="unitPrice">Unit Price</Label>
              <Input
                id="unitPrice"
                type="number"
                step="0.01"
                value={formData.unitPrice}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, unitPrice: e.target.value }))
                }
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Quantity and Unit */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                step="0.01"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, quantity: e.target.value }))
                }
                placeholder="1"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="unit">Unit</Label>
              <Input
                id="unit"
                value={formData.unit}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, unit: e.target.value }))
                }
                placeholder="EA, SF, LF, LS..."
              />
            </div>
          </div>

          {/* Exclusion toggle */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isExclusion"
              checked={formData.isExclusion}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({
                  ...prev,
                  isExclusion: checked === true,
                }))
              }
            />
            <Label htmlFor="isExclusion" className="text-sm">
              Mark as exclusion (not included in bid)
            </Label>
          </div>

          {/* Training contribution opt-in */}
          {userOptedIn && hasAnyChange && (
            <Alert className="border-blue-200 bg-blue-50">
              <Shield className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <div className="flex items-start gap-2">
                  <Checkbox
                    id="contributeTraining"
                    checked={contributeToTraining}
                    onCheckedChange={(checked) =>
                      setContributeToTraining(checked === true)
                    }
                    className="mt-0.5"
                  />
                  <label htmlFor="contributeTraining" className="text-sm">
                    Contribute this correction to improve AI accuracy for all users.
                    <span className="block text-xs text-blue-600 mt-1">
                      Your data is anonymized before submission.
                    </span>
                  </label>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !hasAnyChange}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
