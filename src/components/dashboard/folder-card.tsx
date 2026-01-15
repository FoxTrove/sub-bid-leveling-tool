"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import {
  FolderOpen,
  Folder,
  ChevronDown,
  ChevronRight,
  MoreVertical,
  Trash2,
  Edit2,
  MapPin,
  Users,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  Loader2,
  Building2,
} from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { toast } from "sonner"
import { formatRelativeTime, formatCurrency } from "@/lib/utils/format"
import type { FolderWithProjects, ProjectForDashboard, ProjectStatus } from "@/types"

interface FolderCardProps {
  folder: FolderWithProjects
  defaultOpen?: boolean
}

const statusConfig: Record<
  ProjectStatus,
  { label: string; icon: typeof CheckCircle2; color: string }
> = {
  draft: { label: "Draft", icon: Clock, color: "text-muted-foreground" },
  uploading: { label: "Uploading", icon: Loader2, color: "text-blue-500" },
  processing: { label: "Processing", icon: Loader2, color: "text-blue-500" },
  complete: { label: "Complete", icon: CheckCircle2, color: "text-green-500" },
  error: { label: "Error", icon: AlertCircle, color: "text-red-500" },
}

// Group projects by trade type and sort
function groupByTrade(projects: ProjectForDashboard[]): Record<string, ProjectForDashboard[]> {
  const grouped = projects.reduce((acc, project) => {
    const trade = project.trade_type
    if (!acc[trade]) acc[trade] = []
    acc[trade].push(project)
    return acc
  }, {} as Record<string, ProjectForDashboard[]>)

  // Sort projects within each trade by created_at descending
  Object.keys(grouped).forEach(trade => {
    grouped[trade].sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
  })

  return grouped
}

export function FolderCard({ folder, defaultOpen = false }: FolderCardProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(defaultOpen)

  const projectsByTrade = groupByTrade(folder.projects)
  const sortedTrades = Object.keys(projectsByTrade).sort()
  const totalProjects = folder.projects.length
  const uniqueTrades = sortedTrades.length

  const handleDeleteFolder = async () => {
    if (folder.projects.length > 0) {
      toast.error("Cannot delete folder with comparisons. Move or delete them first.")
      return
    }

    if (!confirm("Are you sure you want to delete this folder?")) {
      return
    }

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("project_folders")
        .delete()
        .eq("id", folder.id)

      if (error) throw error

      toast.success("Folder deleted")
      router.refresh()
    } catch {
      toast.error("Failed to delete folder")
    }
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="transition-shadow hover:shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <CollapsibleTrigger asChild>
              <button className="flex items-center gap-3 text-left hover:opacity-80">
                <div className="rounded-lg bg-primary/10 p-2">
                  {isOpen ? (
                    <FolderOpen className="h-5 w-5 text-primary" />
                  ) : (
                    <Folder className="h-5 w-5 text-primary" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">{folder.name}</h3>
                    {isOpen ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                    {folder.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {folder.location}
                      </span>
                    )}
                    {folder.client_name && (
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {folder.client_name}
                      </span>
                    )}
                    {folder.project_size && (
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {folder.project_size}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            </CollapsibleTrigger>

            <div className="flex items-center gap-2">
              <div className="text-right text-sm">
                <p className="font-medium">{totalProjects} comparison{totalProjects !== 1 ? 's' : ''}</p>
                <p className="text-muted-foreground">{uniqueTrades} trade{uniqueTrades !== 1 ? 's' : ''}</p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/compare/new?folder=${folder.id}`}>
                      <FileText className="mr-2 h-4 w-4" />
                      New Comparison
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleDeleteFolder}
                    className="text-red-600 focus:text-red-600"
                    disabled={folder.projects.length > 0}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Folder
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="pt-0">
            {totalProjects === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-center">
                <p className="text-muted-foreground">No comparisons yet</p>
                <Link href={`/compare/new?folder=${folder.id}`}>
                  <Button variant="outline" size="sm" className="mt-3">
                    Create First Comparison
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {sortedTrades.map((trade) => (
                  <div key={trade}>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                      <Badge variant="outline" className="font-normal">
                        {trade}
                      </Badge>
                      <span className="text-xs">
                        ({projectsByTrade[trade].length})
                      </span>
                    </h4>
                    <div className="space-y-2">
                      {projectsByTrade[trade].map((project) => (
                        <ProjectRow key={project.id} project={project} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}

function ProjectRow({ project }: { project: ProjectForDashboard }) {
  const status = statusConfig[project.status]
  const StatusIcon = status.icon
  const bidCount = project.bid_documents?.length ?? 0

  const priceRange =
    project.comparison_results?.price_low && project.comparison_results?.price_high
      ? `${formatCurrency(project.comparison_results.price_low)} - ${formatCurrency(project.comparison_results.price_high)}`
      : null

  return (
    <Link href={`/compare/${project.id}`}>
      <div className="group flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50">
        <div className="flex items-center gap-3">
          <StatusIcon
            className={`h-4 w-4 ${status.color} ${
              project.status === "processing" || project.status === "uploading"
                ? "animate-spin"
                : ""
            }`}
          />
          <div>
            <p className="font-medium group-hover:underline">{project.name}</p>
            <p className="text-xs text-muted-foreground">
              {bidCount} bid{bidCount !== 1 ? 's' : ''} · {formatRelativeTime(project.created_at)}
            </p>
          </div>
        </div>

        <div className="text-right text-sm">
          {project.status === "complete" && priceRange && (
            <p className="font-medium">{priceRange}</p>
          )}
          {project.status === "complete" && project.comparison_results?.recommendation_json && (
            <p className="text-xs text-primary">
              {project.comparison_results.recommendation_json.recommended_contractor_name}
            </p>
          )}
          {project.status === "error" && (
            <p className="text-xs text-red-500">Failed</p>
          )}
          {(project.status === "processing" || project.status === "uploading") && (
            <p className="text-xs text-blue-500">In progress...</p>
          )}
        </div>
      </div>
    </Link>
  )
}
