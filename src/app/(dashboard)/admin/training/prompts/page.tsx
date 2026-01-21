"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileCode, Plus, ExternalLink } from "lucide-react"

// Placeholder prompts - in a full implementation these would come from the database
const prompts = [
  {
    id: "extraction",
    name: "Extraction Prompt",
    description: "Main prompt for extracting scope items from bid documents",
    file: "src/lib/ai/prompts/extraction.ts",
    lastModified: "2025-01-15",
    status: "active",
  },
  {
    id: "normalization",
    name: "Normalization Prompt",
    description: "Prompt for normalizing extracted items across bids",
    file: "src/lib/ai/prompts/normalization.ts",
    lastModified: "2025-01-15",
    status: "active",
  },
  {
    id: "recommendation",
    name: "Recommendation Prompt",
    description: "Prompt for generating bid recommendations",
    file: "src/lib/ai/prompts/recommendation.ts",
    lastModified: "2025-01-15",
    status: "active",
  },
]

export default function PromptsManagementPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Prompt Management</h1>
          <p className="text-slate-400 mt-1">
            View and manage AI extraction prompts
          </p>
        </div>
        <Button className="bg-amber-600 hover:bg-amber-700" disabled>
          <Plus className="h-4 w-4 mr-2" />
          Add Variant
        </Button>
      </div>

      {/* Info Banner */}
      <Card className="bg-blue-950/20 border-blue-800/50">
        <CardContent className="py-4">
          <p className="text-sm text-blue-300">
            Prompts are currently managed via code in the <code className="bg-blue-900/50 px-1 py-0.5 rounded">src/lib/ai/prompts/</code> directory.
            A database-driven prompt management system with A/B testing is planned for a future release.
          </p>
        </CardContent>
      </Card>

      {/* Prompts List */}
      <div className="space-y-4">
        {prompts.map((prompt) => (
          <Card key={prompt.id} className="bg-slate-900 border-slate-800">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-800">
                    <FileCode className="h-5 w-5 text-slate-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-slate-100">
                      {prompt.name}
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                      {prompt.description}
                    </CardDescription>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className="bg-emerald-900/20 text-emerald-400 border-emerald-800"
                >
                  {prompt.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-slate-400">
                    File: <code className="bg-slate-800 px-1 py-0.5 rounded text-slate-300">{prompt.file}</code>
                  </p>
                  <p className="text-xs text-slate-500">
                    Last modified: {prompt.lastModified}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-slate-700 text-slate-300 hover:bg-slate-800"
                  asChild
                >
                  <a
                    href={`vscode://file/${process.cwd()}/${prompt.file}`}
                    target="_blank"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open in Editor
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Future Features */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-lg text-slate-100">Planned Features</CardTitle>
          <CardDescription className="text-slate-400">
            Coming in future updates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-slate-400">
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-600" />
              Database-driven prompt storage
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-600" />
              A/B testing for prompt variants
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-600" />
              Trade-specific confidence thresholds
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-600" />
              Automatic prompt improvement suggestions
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
