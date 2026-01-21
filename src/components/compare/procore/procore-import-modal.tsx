"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Loader2,
  Building2,
  FileText,
  Users,
  ChevronRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { TRADE_TYPES, type ProjectFolder } from "@/types"
import type { ProcoreProject, ProcoreBidPackage, ProcoreBid } from "@/types/procore"

interface ProcoreImportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  folders: ProjectFolder[]
  preselectedFolderId?: string
}

type ImportStep = "projects" | "bid-packages" | "configure" | "importing"

interface BidPackageWithBids extends ProcoreBidPackage {
  bids: ProcoreBid[]
  bidCount: number
}

export function ProcoreImportModal({
  open,
  onOpenChange,
  folders,
  preselectedFolderId,
}: ProcoreImportModalProps) {
  const router = useRouter()
  const [step, setStep] = useState<ImportStep>("projects")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Data
  const [projects, setProjects] = useState<ProcoreProject[]>([])
  const [selectedProject, setSelectedProject] = useState<ProcoreProject | null>(null)
  const [bidPackages, setBidPackages] = useState<BidPackageWithBids[]>([])
  const [selectedBidPackage, setSelectedBidPackage] = useState<BidPackageWithBids | null>(null)

  // Configuration
  const [projectName, setProjectName] = useState("")
  const [tradeType, setTradeType] = useState("")
  const [folderId, setFolderId] = useState(preselectedFolderId || "")

  // Import result
  const [importResult, setImportResult] = useState<{
    success: boolean
    projectId?: string
    documentsImported?: number
    errors?: string[]
  } | null>(null)

  // Load projects on open
  useEffect(() => {
    if (open && step === "projects" && projects.length === 0) {
      loadProjects()
    }
  }, [open, step])

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setStep("projects")
        setSelectedProject(null)
        setSelectedBidPackage(null)
        setBidPackages([])
        setProjectName("")
        setTradeType("")
        setError(null)
        setImportResult(null)
      }, 300)
    }
  }, [open])

  const loadProjects = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/procore/projects")
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to load projects")
      }

      const data = await response.json()
      setProjects(data.projects || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load projects")
    } finally {
      setIsLoading(false)
    }
  }

  const loadBidPackages = async (projectId: number) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/procore/projects/${projectId}/bid-packages`)
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to load bid packages")
      }

      const data = await response.json()
      setBidPackages(data.bidPackages || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load bid packages")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectProject = (project: ProcoreProject) => {
    setSelectedProject(project)
    setStep("bid-packages")
    loadBidPackages(project.id)
  }

  const handleSelectBidPackage = (bidPackage: BidPackageWithBids) => {
    setSelectedBidPackage(bidPackage)
    // Pre-fill project name
    setProjectName(`${selectedProject?.name} - ${bidPackage.title}`)
    setStep("configure")
  }

  const handleImport = async () => {
    if (!selectedProject || !selectedBidPackage || !tradeType || !folderId) {
      toast.error("Please fill in all required fields")
      return
    }

    setStep("importing")
    setError(null)

    try {
      const response = await fetch("/api/procore/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          procoreProjectId: selectedProject.id,
          bidPackageId: selectedBidPackage.id,
          tradeType,
          projectName: projectName || `${selectedProject.name} - ${selectedBidPackage.title}`,
          folderId,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Import failed")
      }

      setImportResult(result)

      if (result.success && result.documentsImported >= 2) {
        toast.success(`Imported ${result.documentsImported} bids from Procore!`)
        // Navigate to the new project
        router.push(`/compare/${result.projectId}`)
        onOpenChange(false)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed")
      setStep("configure")
    }
  }

  const renderProjectsList = () => (
    <div className="space-y-4">
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : projects.length === 0 ? (
        <div className="py-12 text-center">
          <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 font-medium">No projects found</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            You don&apos;t have any active projects in Procore.
          </p>
        </div>
      ) : (
        <div className="max-h-[400px] space-y-2 overflow-y-auto">
          {projects.map((project) => (
            <button
              key={project.id}
              onClick={() => handleSelectProject(project)}
              className="flex w-full items-center justify-between rounded-lg border p-4 text-left transition-colors hover:bg-muted/50"
            >
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{project.name}</p>
                  {(project.city || project.state_code) && (
                    <p className="text-sm text-muted-foreground">
                      {[project.city, project.state_code].filter(Boolean).join(", ")}
                    </p>
                  )}
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
          ))}
        </div>
      )}
    </div>
  )

  const renderBidPackagesList = () => (
    <div className="space-y-4">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          setStep("projects")
          setSelectedProject(null)
          setBidPackages([])
        }}
        className="mb-2"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to projects
      </Button>

      {selectedProject && (
        <div className="rounded-lg bg-muted/50 p-3">
          <p className="text-sm font-medium">{selectedProject.name}</p>
          {(selectedProject.city || selectedProject.state_code) && (
            <p className="text-xs text-muted-foreground">
              {[selectedProject.city, selectedProject.state_code].filter(Boolean).join(", ")}
            </p>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : bidPackages.length === 0 ? (
        <div className="py-12 text-center">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 font-medium">No bid packages found</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            This project doesn&apos;t have any bid packages yet.
          </p>
        </div>
      ) : (
        <div className="max-h-[350px] space-y-2 overflow-y-auto">
          {bidPackages.map((pkg) => (
            <button
              key={pkg.id}
              onClick={() => handleSelectBidPackage(pkg)}
              disabled={pkg.bidCount < 2}
              className="flex w-full items-center justify-between rounded-lg border p-4 text-left transition-colors hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{pkg.title}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-3 w-3" />
                    <span>{pkg.bidCount} bid{pkg.bidCount !== 1 ? "s" : ""}</span>
                    <Badge
                      variant={pkg.status === "closed" ? "secondary" : "outline"}
                      className="ml-1"
                    >
                      {pkg.status}
                    </Badge>
                  </div>
                </div>
              </div>
              {pkg.bidCount >= 2 ? (
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              ) : (
                <span className="text-xs text-muted-foreground">
                  Need 2+ bids
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )

  const renderConfigureForm = () => (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          setStep("bid-packages")
          setSelectedBidPackage(null)
        }}
        className="mb-2"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to bid packages
      </Button>

      {/* Summary */}
      <div className="rounded-lg bg-muted/50 p-4">
        <h4 className="font-medium">Import Summary</h4>
        <dl className="mt-2 space-y-1 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Project</dt>
            <dd className="font-medium">{selectedProject?.name}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Bid Package</dt>
            <dd className="font-medium">{selectedBidPackage?.title}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Bids to Import</dt>
            <dd className="font-medium">{selectedBidPackage?.bidCount}</dd>
          </div>
        </dl>
      </div>

      {/* Configuration Form */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>
            Project Folder <span className="text-destructive">*</span>
          </Label>
          <Select value={folderId} onValueChange={setFolderId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a folder" />
            </SelectTrigger>
            <SelectContent>
              {folders.map((folder) => (
                <SelectItem key={folder.id} value={folder.id}>
                  {folder.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>
            Trade Type <span className="text-destructive">*</span>
          </Label>
          <Select value={tradeType} onValueChange={setTradeType}>
            <SelectTrigger>
              <SelectValue placeholder="Select trade type" />
            </SelectTrigger>
            <SelectContent>
              {TRADE_TYPES.map((trade) => (
                <SelectItem key={trade} value={trade}>
                  {trade}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Comparison Name</Label>
          <Input
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder={`${selectedProject?.name} - ${selectedBidPackage?.title}`}
          />
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button
        onClick={handleImport}
        disabled={!folderId || !tradeType}
        className="w-full"
      >
        Import {selectedBidPackage?.bidCount} Bids
      </Button>
    </div>
  )

  const renderImporting = () => (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <h3 className="mt-4 font-medium">Importing from Procore...</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Downloading bid documents and creating your comparison.
      </p>
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            Import from Procore
          </DialogTitle>
          <DialogDescription>
            {step === "projects" && "Select a Procore project to import bids from."}
            {step === "bid-packages" && "Select a bid package to import."}
            {step === "configure" && "Configure your comparison settings."}
            {step === "importing" && "Please wait while we import your bids."}
          </DialogDescription>
        </DialogHeader>

        {step === "projects" && renderProjectsList()}
        {step === "bid-packages" && renderBidPackagesList()}
        {step === "configure" && renderConfigureForm()}
        {step === "importing" && renderImporting()}
      </DialogContent>
    </Dialog>
  )
}
