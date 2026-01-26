"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ExtractedItem, TextPosition } from "@/types"

interface WordViewerProps {
  content: ArrayBuffer
  zoom: number
  highlightedPosition: TextPosition | null
  onPositionClick: (position: { paragraph: number }) => void
  extractedItems: ExtractedItem[]
}

interface ParagraphData {
  index: number
  html: string
  text: string
}

export function WordViewer({
  content,
  zoom,
  highlightedPosition,
  onPositionClick,
  extractedItems,
}: WordViewerProps) {
  const [paragraphs, setParagraphs] = useState<ParagraphData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Parse Word document
  useEffect(() => {
    async function parseWord() {
      setIsLoading(true)
      setError(null)

      try {
        const mammoth = await import("mammoth")

        // Convert ArrayBuffer to a format mammoth can use
        const result = await mammoth.convertToHtml({
          arrayBuffer: content,
        })

        // Parse HTML into paragraphs
        const parser = new DOMParser()
        const doc = parser.parseFromString(result.value, "text/html")
        const elements = doc.body.children

        const parsedParagraphs: ParagraphData[] = []
        let index = 0

        for (let i = 0; i < elements.length; i++) {
          const el = elements[i]
          const html = el.outerHTML
          const text = el.textContent || ""

          // Skip empty paragraphs
          if (text.trim()) {
            parsedParagraphs.push({
              index,
              html,
              text,
            })
            index++
          }
        }

        setParagraphs(parsedParagraphs)
      } catch (err) {
        console.error("Failed to parse Word document:", err)
        setError("Failed to parse Word document")
      } finally {
        setIsLoading(false)
      }
    }

    parseWord()
  }, [content])

  // Scroll to highlighted position
  useEffect(() => {
    if (!highlightedPosition || highlightedPosition.type !== "word") return

    const wordPos = highlightedPosition as { type: "word"; paragraph: number }
    const paragraphEl = document.getElementById(`paragraph-${wordPos.paragraph}`)
    paragraphEl?.scrollIntoView({ behavior: "smooth", block: "center" })
  }, [highlightedPosition])

  // Get highlighted paragraphs
  const highlightedParagraphs = useMemo(() => {
    const highlighted = new Set<number>()
    extractedItems.forEach((item) => {
      if (!item.text_position) return
      const pos = item.text_position as { paragraph?: number }
      if (pos.paragraph !== undefined) {
        highlighted.add(pos.paragraph)
      }
    })
    return highlighted
  }, [extractedItems])

  const handleParagraphClick = useCallback(
    (index: number) => {
      onPositionClick({ paragraph: index })
    },
    [onPositionClick]
  )

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

  if (paragraphs.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        No content found in document
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto">
      <div
        className="mx-auto max-w-4xl p-6"
        style={{
          fontSize: `${16 * zoom}px`,
        }}
      >
        {/* Document content */}
        <div className="prose prose-sm max-w-none dark:prose-invert">
          {paragraphs.map((para) => {
            const isHighlighted = highlightedParagraphs.has(para.index)

            return (
              <div
                key={para.index}
                id={`paragraph-${para.index}`}
                className={cn(
                  "relative cursor-pointer rounded px-2 py-1 transition-colors -mx-2",
                  isHighlighted
                    ? "bg-yellow-100 dark:bg-yellow-900/30"
                    : "hover:bg-muted/30"
                )}
                onClick={() => handleParagraphClick(para.index)}
              >
                {/* Paragraph number indicator */}
                <span className="absolute -left-8 top-1 text-xs text-muted-foreground opacity-0 group-hover:opacity-100">
                  {para.index + 1}
                </span>

                {/* Render HTML content */}
                <div
                  dangerouslySetInnerHTML={{ __html: para.html }}
                  className="[&>p]:mb-0 [&>h1]:mt-4 [&>h2]:mt-3 [&>h3]:mt-2 [&>ul]:my-2 [&>ol]:my-2"
                />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
