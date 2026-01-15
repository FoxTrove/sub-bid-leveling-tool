"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import {
  MoreVertical,
  FileText,
  Trash2,
  ExternalLink,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
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
import { toast } from "sonner"
import { formatRelativeTime, formatCurrency } from "@/lib/utils/format"
import type { Project, ProjectStatus } from "@/types"

interface ProjectCardProps {
  project: Project & {
    bid_documents?: { id: string }[]
    comparison_results?: {
      price_low: number | null
      price_high: number | null
      recommendation_json: {
        recommended_contractor_name: string
      }
    } | null
  }
}

const statusConfig: Record<
  ProjectStatus,
  { label: string; icon: typeof CheckCircle2; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  draft: { label: "Draft", icon: Clock, variant: "secondary" },
  uploading: { label: "Uploading", icon: Loader2, variant: "outline" },
  processing: { label: "Processing", icon: Loader2, variant: "outline" },
  complete: { label: "Complete", icon: CheckCircle2, variant: "default" },
  error: { label: "Error", icon: AlertCircle, variant: "destructive" },
}

export function ProjectCard({ project }: ProjectCardProps) {
  const router = useRouter()
  const status = statusConfig[project.status]
  const StatusIcon = status.icon

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this comparison?")) {
      return
    }

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", project.id)

      if (error) throw error

      toast.success("Comparison deleted")
      router.refresh()
    } catch {
      toast.error("Failed to delete comparison")
    }
  }

  const bidCount = project.bid_documents?.length ?? 0
  const priceRange =
    project.comparison_results?.price_low && project.comparison_results?.price_high
      ? `${formatCurrency(project.comparison_results.price_low)} - ${formatCurrency(project.comparison_results.price_high)}`
      : null

  return (
    <Card className="group transition-shadow hover:shadow-md">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <Link
            href={`/compare/${project.id}`}
            className="font-semibold hover:underline"
          >
            {project.name}
          </Link>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{project.trade_type}</span>
            {project.location && (
              <>
                <span>·</span>
                <span>{project.location}</span>
              </>
            )}
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/compare/${project.id}`}>
                <ExternalLink className="mr-2 h-4 w-4" />
                View Details
              </Link>
            </DropdownMenuItem>
            {project.status === "complete" && (
              <DropdownMenuItem asChild>
                <Link href={`/api/export/${project.id}`} target="_blank">
                  <FileText className="mr-2 h-4 w-4" />
                  Export PDF
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleDelete}
              className="text-red-600 focus:text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant={status.variant} className="gap-1">
              <StatusIcon
                className={`h-3 w-3 ${
                  project.status === "processing" || project.status === "uploading"
                    ? "animate-spin"
                    : ""
                }`}
              />
              {status.label}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {bidCount} bid{bidCount !== 1 ? "s" : ""}
            </span>
          </div>

          <span className="text-sm text-muted-foreground">
            {formatRelativeTime(project.created_at)}
          </span>
        </div>

        {project.status === "complete" && project.comparison_results && (
          <div className="mt-4 rounded-lg bg-muted/50 p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Price Range</span>
              <span className="font-medium">{priceRange}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Recommended</span>
              <span className="font-medium text-primary">
                {project.comparison_results.recommendation_json.recommended_contractor_name}
              </span>
            </div>
          </div>
        )}

        {project.status === "error" && project.error_message && (
          <p className="mt-3 text-sm text-destructive">{project.error_message}</p>
        )}
      </CardContent>
    </Card>
  )
}
