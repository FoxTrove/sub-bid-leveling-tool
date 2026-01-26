"use client"

import { useMemo } from "react"
import { DocumentViewerProvider } from "@/contexts/document-viewer-context"
import { DocumentViewerPanel } from "@/components/compare/document-viewer"
import { SummaryCards } from "./summary-cards"
import { ComparisonGrid } from "./comparison-grid"
import { RecommendationPanel } from "./recommendation-panel"
import { ContractorDetailCards } from "./contractor-detail-cards"
import type { ComparisonResult, BidDocumentWithItems, ExtractedItem, BidDocument } from "@/types"

interface ResultsWithViewerProps {
  documents: BidDocumentWithItems[]
  results: ComparisonResult
  projectId: string
  tradeType: string
  userOptedIn: boolean
}

export function ResultsWithViewer({
  documents,
  results,
  projectId,
  tradeType,
  userOptedIn,
}: ResultsWithViewerProps) {
  // Flatten all extracted items from all documents
  const allExtractedItems = useMemo(() => {
    return documents.flatMap((doc) =>
      (doc.extracted_items || []).map((item) => ({
        ...item,
        bid_document_id: doc.id,
      }))
    )
  }, [documents])

  // Convert BidDocumentWithItems to BidDocument for the viewer
  // BidDocumentWithItems extends BidDocument, so we can just spread the doc
  // and omit the extracted_items
  const bidDocuments: BidDocument[] = useMemo(() => {
    return documents.map((doc) => {
      const { extracted_items, ...bidDoc } = doc
      return bidDoc as BidDocument
    })
  }, [documents])

  return (
    <DocumentViewerProvider>
      <DocumentViewerPanel
        documents={bidDocuments}
        extractedItems={allExtractedItems as ExtractedItem[]}
      >
        <div className="space-y-8">
          <SummaryCards
            results={results}
            documents={documents}
          />

          <RecommendationPanel
            recommendation={results.recommendation_json}
            documents={documents}
          />

          <ComparisonGrid
            documents={documents}
            results={results}
            projectId={projectId}
            tradeType={tradeType}
            userOptedIn={userOptedIn}
          />

          <ContractorDetailCards
            documents={documents}
            results={results}
          />
        </div>
      </DocumentViewerPanel>
    </DocumentViewerProvider>
  )
}
