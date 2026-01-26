"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { ExtractedItem, TextPosition } from "@/types"

interface PdfViewerProps {
  content: ArrayBuffer
  zoom: number
  highlightedPosition: TextPosition | null
  onPositionClick: (position: { page: number }) => void
  extractedItems: ExtractedItem[]
}

interface PdfPage {
  pageNumber: number
  canvas: HTMLCanvasElement | null
  textContent: Array<{
    str: string
    transform: number[]
    width: number
    height: number
  }>
}

export function PdfViewer({
  content,
  zoom,
  highlightedPosition,
  onPositionClick,
  extractedItems,
}: PdfViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [pdfDocument, setPdfDocument] = useState<unknown>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [pageCanvases, setPageCanvases] = useState<Map<number, HTMLCanvasElement>>(new Map())
  const [textLayers, setTextLayers] = useState<Map<number, PdfPage["textContent"]>>(new Map())
  const [error, setError] = useState<string | null>(null)

  // Load PDF document
  useEffect(() => {
    let cancelled = false

    async function loadPdf() {
      setIsLoading(true)
      setError(null)

      try {
        // Dynamic import of pdfjs-dist
        const pdfjsLib = await import("pdfjs-dist")

        // Set worker source
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

        const pdf = await pdfjsLib.getDocument({ data: content }).promise

        if (cancelled) return

        setPdfDocument(pdf)
        setTotalPages(pdf.numPages)
        setCurrentPage(1)
      } catch (err) {
        console.error("Failed to load PDF:", err)
        setError("Failed to load PDF document")
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    loadPdf()

    return () => {
      cancelled = true
    }
  }, [content])

  // Render current page
  useEffect(() => {
    if (!pdfDocument || !containerRef.current) return

    let cancelled = false

    async function renderPage() {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pdf = pdfDocument as any
        const page = await pdf.getPage(currentPage)

        if (cancelled) return

        const scale = zoom
        const viewport = page.getViewport({ scale })

        // Create or reuse canvas
        let canvas = pageCanvases.get(currentPage)
        if (!canvas) {
          canvas = document.createElement("canvas")
          setPageCanvases((prev) => new Map(prev).set(currentPage, canvas!))
        }

        const context = canvas.getContext("2d")
        if (!context) return

        canvas.height = viewport.height
        canvas.width = viewport.width

        // Render PDF page
        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise

        // Get text content for highlighting
        const textContent = await page.getTextContent()
        const textItems = textContent.items.map((item: { str: string; transform: number[]; width: number; height: number }) => ({
          str: item.str,
          transform: item.transform,
          width: item.width,
          height: item.height,
        }))

        if (!cancelled) {
          setTextLayers((prev) => new Map(prev).set(currentPage, textItems))
        }
      } catch (err) {
        console.error("Failed to render page:", err)
      }
    }

    renderPage()

    return () => {
      cancelled = true
    }
  }, [pdfDocument, currentPage, zoom, pageCanvases])

  // Scroll to highlighted position
  useEffect(() => {
    if (!highlightedPosition || highlightedPosition.type !== "pdf") return

    const pdfPos = highlightedPosition as { type: "pdf"; page: number }
    if (pdfPos.page !== currentPage) {
      setCurrentPage(pdfPos.page)
    }
  }, [highlightedPosition, currentPage])

  // Navigation handlers
  const goToPrevPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(prev - 1, 1))
  }, [])

  const goToNextPage = useCallback(() => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
  }, [totalPages])

  // Get items on current page for highlighting
  const currentPageItems = useMemo(() => {
    return extractedItems.filter((item) => {
      if (!item.text_position) return false
      const pos = item.text_position as Record<string, unknown>
      return pos.page === currentPage
    })
  }, [extractedItems, currentPage])

  // Handle click on text layer
  const handleTextClick = useCallback(
    (event: React.MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return

      // For now, just trigger with the page number
      // More precise position matching would require text layer coordinates
      onPositionClick({ page: currentPage })
    },
    [currentPage, onPositionClick]
  )

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowLeft") {
        goToPrevPage()
      } else if (event.key === "ArrowRight") {
        goToNextPage()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [goToPrevPage, goToNextPage])

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
        <p>{error}</p>
      </div>
    )
  }

  const currentCanvas = pageCanvases.get(currentPage)
  const currentTextLayer = textLayers.get(currentPage)

  return (
    <div className="flex h-full flex-col">
      {/* Page Navigation */}
      <div className="flex items-center justify-center gap-2 border-b bg-muted/30 py-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={goToPrevPage}
          disabled={currentPage <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm">
          Page {currentPage} of {totalPages}
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={goToNextPage}
          disabled={currentPage >= totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* PDF Canvas Container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto p-4"
        onClick={handleTextClick}
      >
        <div className="relative mx-auto">
          {/* Canvas Layer */}
          {currentCanvas && (
            <canvas
              ref={(el) => {
                if (el && currentCanvas) {
                  const ctx = el.getContext("2d")
                  if (ctx) {
                    el.width = currentCanvas.width
                    el.height = currentCanvas.height
                    ctx.drawImage(currentCanvas, 0, 0)
                  }
                }
              }}
              className="shadow-lg"
            />
          )}

          {/* Text Layer Overlay (for highlighting) */}
          {currentTextLayer && currentPageItems.length > 0 && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                width: currentCanvas?.width,
                height: currentCanvas?.height,
              }}
            >
              {currentPageItems.map((item) => {
                const pos = item.text_position as {
                  x?: number
                  y?: number
                  width?: number
                  height?: number
                }
                if (!pos.x || !pos.y) return null

                return (
                  <div
                    key={item.id}
                    className={cn(
                      "absolute bg-yellow-300/30 border border-yellow-400/50 rounded",
                      "transition-colors duration-200"
                    )}
                    style={{
                      left: pos.x * zoom,
                      top: pos.y * zoom,
                      width: (pos.width || 100) * zoom,
                      height: (pos.height || 20) * zoom,
                    }}
                    title={item.description}
                  />
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
