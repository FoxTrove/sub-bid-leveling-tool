"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Loader2 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import type { ExtractedItem, TextPosition } from "@/types"

interface ExcelViewerProps {
  content: ArrayBuffer
  zoom: number
  highlightedPosition: TextPosition | null
  onPositionClick: (position: { sheet: string; row: number; col: number }) => void
  extractedItems: ExtractedItem[]
}

interface SheetData {
  name: string
  data: (string | number | null)[][]
  merges?: Array<{
    s: { r: number; c: number }
    e: { r: number; c: number }
  }>
}

export function ExcelViewer({
  content,
  zoom,
  highlightedPosition,
  onPositionClick,
  extractedItems,
}: ExcelViewerProps) {
  const [sheets, setSheets] = useState<SheetData[]>([])
  const [activeSheet, setActiveSheet] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Parse Excel file
  useEffect(() => {
    async function parseExcel() {
      setIsLoading(true)
      setError(null)

      try {
        const XLSX = await import("xlsx")
        const workbook = XLSX.read(content, { type: "array" })

        const parsedSheets: SheetData[] = workbook.SheetNames.map((name) => {
          const sheet = workbook.Sheets[name]
          const jsonData = XLSX.utils.sheet_to_json<(string | number | null)[]>(sheet, {
            header: 1,
            defval: null,
          })

          return {
            name,
            data: jsonData as (string | number | null)[][],
            merges: sheet["!merges"],
          }
        })

        setSheets(parsedSheets)
        if (parsedSheets.length > 0) {
          setActiveSheet(parsedSheets[0].name)
        }
      } catch (err) {
        console.error("Failed to parse Excel file:", err)
        setError("Failed to parse spreadsheet")
      } finally {
        setIsLoading(false)
      }
    }

    parseExcel()
  }, [content])

  // Scroll to highlighted position
  useEffect(() => {
    if (!highlightedPosition || highlightedPosition.type !== "excel") return

    const excelPos = highlightedPosition as { type: "excel"; sheet: string; row: number }
    if (excelPos.sheet !== activeSheet) {
      setActiveSheet(excelPos.sheet)
    }

    // Scroll to row
    setTimeout(() => {
      const rowEl = document.getElementById(`row-${excelPos.row}`)
      rowEl?.scrollIntoView({ behavior: "smooth", block: "center" })
    }, 100)
  }, [highlightedPosition, activeSheet])

  // Get items for current sheet
  const currentSheetItems = useMemo(() => {
    return extractedItems.filter((item) => {
      if (!item.text_position) return false
      const pos = item.text_position as Record<string, unknown>
      return pos.sheet === activeSheet
    })
  }, [extractedItems, activeSheet])

  // Get highlighted rows
  const highlightedRows = useMemo(() => {
    const rows = new Set<number>()
    currentSheetItems.forEach((item) => {
      const pos = item.text_position as { row?: number }
      if (pos.row !== undefined) {
        rows.add(pos.row)
      }
    })
    return rows
  }, [currentSheetItems])

  const handleCellClick = useCallback(
    (sheetName: string, rowIndex: number, colIndex: number) => {
      onPositionClick({ sheet: sheetName, row: rowIndex, col: colIndex })
    },
    [onPositionClick]
  )

  // Convert column index to Excel-style letter (A, B, C, ... AA, AB, etc.)
  const getColumnLetter = (index: number): string => {
    let result = ""
    let i = index
    while (i >= 0) {
      result = String.fromCharCode((i % 26) + 65) + result
      i = Math.floor(i / 26) - 1
    }
    return result
  }

  const currentSheet = sheets.find((s) => s.name === activeSheet)

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

  if (sheets.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        No data found in spreadsheet
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* Sheet Tabs */}
      {sheets.length > 1 && (
        <Tabs
          value={activeSheet}
          onValueChange={setActiveSheet}
          className="border-b"
        >
          <TabsList className="h-auto w-full justify-start gap-0 rounded-none bg-transparent p-0">
            {sheets.map((sheet) => (
              <TabsTrigger
                key={sheet.name}
                value={sheet.name}
                className="rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-primary data-[state=active]:shadow-none"
              >
                {sheet.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}

      {/* Table Content */}
      <div className="flex-1 overflow-auto">
        {currentSheet && (
          <div
            className="min-w-max"
            style={{
              fontSize: `${14 * zoom}px`,
            }}
          >
            <table className="w-full border-collapse">
              <thead className="sticky top-0 bg-muted/90 backdrop-blur">
                <tr>
                  {/* Row number header */}
                  <th className="border border-border bg-muted px-2 py-1 text-center text-xs font-medium text-muted-foreground w-12">
                    #
                  </th>
                  {/* Column headers (A, B, C, etc.) */}
                  {currentSheet.data[0]?.map((_, colIndex) => (
                    <th
                      key={colIndex}
                      className="border border-border bg-muted px-2 py-1 text-center text-xs font-medium text-muted-foreground min-w-[80px]"
                    >
                      {getColumnLetter(colIndex)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {currentSheet.data.map((row, rowIndex) => {
                  const isHighlighted = highlightedRows.has(rowIndex)

                  return (
                    <tr
                      key={rowIndex}
                      id={`row-${rowIndex}`}
                      className={cn(
                        "transition-colors",
                        isHighlighted && "bg-yellow-100 dark:bg-yellow-900/30"
                      )}
                    >
                      {/* Row number */}
                      <td className="border border-border bg-muted/50 px-2 py-1 text-center text-xs text-muted-foreground">
                        {rowIndex + 1}
                      </td>
                      {/* Cell values */}
                      {row.map((cell, colIndex) => (
                        <td
                          key={colIndex}
                          className={cn(
                            "border border-border px-2 py-1 cursor-pointer hover:bg-muted/30",
                            "transition-colors"
                          )}
                          onClick={() =>
                            handleCellClick(activeSheet, rowIndex, colIndex)
                          }
                        >
                          {cell !== null && cell !== undefined
                            ? String(cell)
                            : ""}
                        </td>
                      ))}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
