"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, FileJson, FileText, Loader2 } from "lucide-react"
import { toast } from "sonner"

export default function TrainingExportsPage() {
  const [exporting, setExporting] = useState<string | null>(null)

  const handleExport = async (format: "json" | "jsonl") => {
    setExporting(format)
    try {
      const response = await fetch(`/api/admin/export?format=${format}`)

      if (!response.ok) {
        throw new Error("Export failed")
      }

      if (format === "jsonl") {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `training_data_${new Date().toISOString().split("T")[0]}.jsonl`
        a.click()
        window.URL.revokeObjectURL(url)
        toast.success("JSONL export downloaded")
      } else {
        const data = await response.json()
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `training_data_${new Date().toISOString().split("T")[0]}.json`
        a.click()
        window.URL.revokeObjectURL(url)
        toast.success("JSON export downloaded")
      }
    } catch (error) {
      toast.error("Export failed")
      console.error(error)
    } finally {
      setExporting(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Export Training Data</h1>
        <p className="text-slate-400 mt-1">
          Download approved corrections for fine-tuning or analysis
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="bg-slate-900 border-slate-800 border-2 border-dashed">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-900/30">
                <FileJson className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-lg text-slate-100">JSONL Format</CardTitle>
                <CardDescription className="text-slate-400">
                  OpenAI-compatible fine-tuning format
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-400">
              Exports data in JSON Lines format with system/user/assistant messages,
              ready for OpenAI fine-tuning jobs.
            </p>
            <Button
              onClick={() => handleExport("jsonl")}
              disabled={exporting !== null}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {exporting === "jsonl" ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Download JSONL
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 border-2 border-dashed">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-slate-800">
                <FileText className="h-6 w-6 text-slate-400" />
              </div>
              <div>
                <CardTitle className="text-lg text-slate-100">JSON Format</CardTitle>
                <CardDescription className="text-slate-400">
                  Raw contribution data for analysis
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-400">
              Exports the raw contribution data including original values,
              corrections, and metadata for custom analysis.
            </p>
            <Button
              onClick={() => handleExport("json")}
              disabled={exporting !== null}
              variant="outline"
              className="w-full border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              {exporting === "json" ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Download JSON
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Prompt Improvement Guide */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-lg text-slate-100">Prompt Improvement Guide</CardTitle>
          <CardDescription className="text-slate-400">
            Use exported data to improve extraction prompts
          </CardDescription>
        </CardHeader>
        <CardContent className="prose prose-invert prose-slate max-w-none">
          <ol className="space-y-3 text-sm text-slate-300">
            <li>
              <strong>Export JSONL</strong> with corrections for low-confidence trade types
            </li>
            <li>
              <strong>Review patterns</strong> in the AI Quality metrics tab to identify
              systematic issues
            </li>
            <li>
              <strong>Update prompts</strong> in <code className="bg-slate-800 px-1 py-0.5 rounded text-amber-400">src/lib/ai/prompts/</code> with:
              <ul className="mt-2 space-y-1">
                <li>Trade-specific examples from corrections</li>
                <li>Explicit handling of edge cases</li>
                <li>Better category definitions</li>
              </ul>
            </li>
            <li>
              <strong>Test updated prompts</strong> and monitor confidence metrics
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}
