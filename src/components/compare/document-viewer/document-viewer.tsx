"use client"

import { useState, useEffect, useCallback } from "react"
import { X, ZoomIn, ZoomOut, Maximize2, Minimize2, FileText, FileSpreadsheet, File, Loader2, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { cn } from "@/lib/utils"
import { useDocumentViewer } from "@/contexts/document-viewer-context"
import { PdfViewer } from "./pdf-viewer"
import { ExcelViewer } from "./excel-viewer"
import { WordViewer } from "./word-viewer"
import type { BidDocument, ExtractedItem, TextPosition } from "@/types"

interface DocumentViewerProps {
  documents: BidDocument[]
  extractedItems: ExtractedItem[]
  className?: string
}

export function DocumentViewer({
  documents,
  extractedItems,
  className,
}: DocumentViewerProps) {
  const {
    isOpen,
    activeDocument,
    highlightedItem,
    zoom,
    setActiveDocument,
    setZoom,
    zoomIn,
    zoomOut,
    closePanel,
    highlightPositionInGrid,
  } = useDocumentViewer()

  const [isFullScreen, setIsFullScreen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [documentContent, setDocumentContent] = useState<{
    [docId: string]: ArrayBuffer | null
  }>({})

  // Get the position from highlighted item for document highlighting
  const highlightedPosition: TextPosition | null = highlightedItem?.item.text_position
    ? (highlightedItem.item.text_position as unknown as TextPosition)
    : null

  // Fetch document content when active document changes
  useEffect(() => {
    async function fetchDocument() {
      if (!activeDocument || documentContent[activeDocument.id]) return

      setIsLoading(true)
      try {
        const response = await fetch(activeDocument.file_url)
        if (response.ok) {
          const buffer = await response.arrayBuffer()
          setDocumentContent((prev) => ({
            ...prev,
            [activeDocument.id]: buffer,
          }))
        }
      } catch (error) {
        console.error("Failed to fetch document:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDocument()
  }, [activeDocument, documentContent])

  // Get items for current document
  const currentItems = extractedItems.filter(
    (item) => item.bid_document_id === activeDocument?.id
  )

  const handleZoomIn = useCallback(() => {
    zoomIn()
  }, [zoomIn])

  const handleZoomOut = useCallback(() => {
    zoomOut()
  }, [zoomOut])

  const handleDocumentClick = useCallback(
    (position: { page?: number; row?: number; paragraph?: number; sheet?: string; col?: number }) => {
      // Find the item that matches this position
      const matchingItem = currentItems.find((item) => {
        if (!item.text_position) return false
        const pos = item.text_position as Record<string, unknown>

        if (position.page !== undefined && pos.page === position.page) {
          return true
        }
        if (position.row !== undefined && pos.row === position.row) {
          return true
        }
        if (position.paragraph !== undefined && pos.paragraph === position.paragraph) {
          return true
        }
        return false
      })

      if (matchingItem && matchingItem.text_position && activeDocument) {
        highlightPositionInGrid(matchingItem.text_position as unknown as TextPosition, activeDocument.id)
      }
    },
    [currentItems, highlightPositionInGrid, activeDocument]
  )

  const handleDocumentSelect = useCallback(
    (docId: string) => {
      const doc = documents.find((d) => d.id === docId)
      if (doc) {
        setActiveDocument(doc)
      }
    },
    [documents, setActiveDocument]
  )

  const getFileIcon = (fileType: string) => {
    if (fileType.includes("pdf")) return <FileText className="h-4 w-4" />
    if (fileType.includes("spreadsheet") || fileType.includes("excel") || fileType.includes("csv")) {
      return <FileSpreadsheet className="h-4 w-4" />
    }
    return <File className="h-4 w-4" />
  }

  const getViewerComponent = () => {
    if (!activeDocument) return null

    const content = documentContent[activeDocument.id]
    if (!content) return null

    const fileType = activeDocument.file_type.toLowerCase()
    const zoomDecimal = zoom / 100 // Convert percentage to decimal for viewers

    if (fileType.includes("pdf")) {
      return (
        <PdfViewer
          content={content}
          zoom={zoomDecimal}
          highlightedPosition={highlightedPosition}
          onPositionClick={handleDocumentClick}
          extractedItems={currentItems}
        />
      )
    }

    if (fileType.includes("spreadsheet") || fileType.includes("excel") || fileType.includes("csv")) {
      return (
        <ExcelViewer
          content={content}
          zoom={zoomDecimal}
          highlightedPosition={highlightedPosition}
          onPositionClick={handleDocumentClick}
          extractedItems={currentItems}
        />
      )
    }

    if (fileType.includes("word") || fileType.includes("document")) {
      return (
        <WordViewer
          content={content}
          zoom={zoomDecimal}
          highlightedPosition={highlightedPosition}
          onPositionClick={handleDocumentClick}
          extractedItems={currentItems}
        />
      )
    }

    return (
      <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
        <File className="h-12 w-12" />
        <p className="mt-4">Unsupported file type: {activeDocument.file_type}</p>
      </div>
    )
  }

  // Don't render if panel is closed
  if (!isOpen) return null

  const panelContent = (
    <div className={cn("flex h-full flex-col bg-background", className)}>
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">Document Viewer</h3>
          {activeDocument && (
            <span className="text-sm text-muted-foreground">
              - {activeDocument.contractor_name}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleZoomOut}
            disabled={zoom <= 50}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="w-12 text-center text-sm text-muted-foreground">
            {zoom}%
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleZoomIn}
            disabled={zoom >= 200}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsFullScreen(!isFullScreen)}
          >
            {isFullScreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
          <Button variant="ghost" size="icon" onClick={closePanel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Document Tabs */}
      {documents.length > 1 && (
        <Tabs
          value={activeDocument?.id || documents[0]?.id}
          onValueChange={handleDocumentSelect}
          className="border-b"
        >
          <TabsList className="h-auto w-full justify-start gap-0 rounded-none bg-transparent p-0">
            {documents.map((doc) => (
              <TabsTrigger
                key={doc.id}
                value={doc.id}
                className="rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-primary data-[state=active]:shadow-none"
              >
                <div className="flex items-center gap-2">
                  {getFileIcon(doc.file_type)}
                  <span className="max-w-[120px] truncate text-sm">
                    {doc.contractor_name}
                  </span>
                </div>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}

      {/* Document Content */}
      <div className="relative flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !activeDocument ? (
          <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
            <FileText className="h-12 w-12" />
            <p className="mt-4">Select a document to view</p>
          </div>
        ) : (
          getViewerComponent()
        )}
      </div>

      {/* Footer with navigation hint */}
      <div className="border-t bg-muted/30 px-4 py-2 text-xs text-muted-foreground">
        <div className="flex items-center justify-between">
          <span>
            Click on text to highlight the corresponding extracted item
          </span>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline">Keyboard:</span>
            <kbd className="rounded bg-muted px-1.5 py-0.5 text-xs">
              <ChevronLeft className="inline h-3 w-3" /> <ChevronRight className="inline h-3 w-3" />
            </kbd>
            <span className="hidden sm:inline">navigate</span>
          </div>
        </div>
      </div>
    </div>
  )

  // Full screen mode
  if (isFullScreen) {
    return (
      <div className="fixed inset-0 z-50 bg-background">
        {panelContent}
      </div>
    )
  }

  return panelContent
}

// Wrapper component that uses ResizablePanel
export function DocumentViewerPanel({
  documents,
  extractedItems,
  children,
}: DocumentViewerProps & { children: React.ReactNode }) {
  const { isOpen, panelWidth, setPanelWidth } = useDocumentViewer()

  if (!isOpen) {
    return <>{children}</>
  }

  return (
    <ResizablePanelGroup direction="horizontal">
      <ResizablePanel
        defaultSize={100 - panelWidth}
        minSize={30}
      >
        {children}
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel
        defaultSize={panelWidth}
        minSize={25}
        maxSize={60}
        onResize={(size) => setPanelWidth(size as unknown as number)}
      >
        <DocumentViewer
          documents={documents}
          extractedItems={extractedItems}
        />
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
