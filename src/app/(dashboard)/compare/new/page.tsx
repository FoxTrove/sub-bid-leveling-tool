"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { ArrowLeft, ArrowRight, Loader2, FolderPlus, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { StepIndicator } from "@/components/compare/wizard/step-indicator"
import { BreakdownSelectionStep } from "@/components/compare/wizard/breakdown-selection-step"
import { FileDropzone, UploadedFile } from "@/components/shared/file-dropzone"
import { UpgradePrompt } from "@/components/shared/upgrade-prompt"
import { toast } from "sonner"
import { TRADE_TYPES, type ProjectFolder, type Profile, type BreakdownStructure, type BreakdownSource } from "@/types"
import { MIN_BIDS, MAX_BIDS } from "@/lib/utils/constants"
import { getUsageStatus, type UsageStatus } from "@/lib/utils/subscription"
import {
  trackComparisonStarted,
  trackComparisonStep,
  trackProcessingStarted,
  trackComparisonAbandoned,
  trackSubmissionError,
} from "@/lib/analytics"
import { ProcoreImportModal } from "@/components/compare/procore/procore-import-modal"

const STEPS = [
  { id: 1, name: "Project Details" },
  { id: 2, name: "Trade Type" },
  { id: 3, name: "Upload Bids" },
  { id: 4, name: "Breakdown" },
  { id: 5, name: "Name Contractors" },
  { id: 6, name: "Review" },
]

interface ContractorInfo {
  fileId: string
  fileName: string
  contractorName: string
}

export default function NewComparisonPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedFolderId = searchParams.get("folder")

  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [folders, setFolders] = useState<ProjectFolder[]>([])
  const [isLoadingFolders, setIsLoadingFolders] = useState(true)
  const [isCreatingFolder, setIsCreatingFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")

  // Usage tracking
  const [usageStatus, setUsageStatus] = useState<UsageStatus | null>(null)
  const [isLoadingUsage, setIsLoadingUsage] = useState(true)

  // Procore integration
  const [isProcoreConnected, setIsProcoreConnected] = useState(false)
  const [showProcoreModal, setShowProcoreModal] = useState(false)

  // Form data
  const [folderId, setFolderId] = useState<string>(preselectedFolderId || "")
  const [projectName, setProjectName] = useState("")
  const [tradeType, setTradeType] = useState("")
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [contractors, setContractors] = useState<ContractorInfo[]>([])

  // Breakdown selection
  const [breakdownStructure, setBreakdownStructure] = useState<BreakdownStructure | null>(null)
  const [breakdownSource, setBreakdownSource] = useState<BreakdownSource | null>(null)
  const [breakdownTemplateId, setBreakdownTemplateId] = useState<string | undefined>(undefined)

  // Early project creation (for text extraction before breakdown selection)
  const [earlyProjectId, setEarlyProjectId] = useState<string | null>(null)
  const [isExtractingText, setIsExtractingText] = useState(false)
  const [textExtractionComplete, setTextExtractionComplete] = useState(false)

  // Tracking refs
  const hasTrackedStart = useRef(false)

  // Load folders and usage status on mount
  useEffect(() => {
    async function loadData() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      // Load folders
      const { data: foldersData } = await supabase
        .from("project_folders")
        .select("*")
        .eq("user_id", user.id)
        .order("name")

      setFolders(foldersData || [])
      setIsLoadingFolders(false)

      // Set preselected folder if valid
      if (preselectedFolderId && foldersData?.some(f => f.id === preselectedFolderId)) {
        setFolderId(preselectedFolderId)
      }

      // Load profile for usage status and Procore connection
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      if (profile) {
        setUsageStatus(getUsageStatus(profile as Profile))
        // Check if Procore is connected
        setIsProcoreConnected(!!profile.procore_connected_at)
      }
      setIsLoadingUsage(false)
    }

    loadData()

    // Track comparison started
    if (!hasTrackedStart.current) {
      hasTrackedStart.current = true
      trackComparisonStarted({
        source: preselectedFolderId ? 'folder' : 'dashboard',
      })
    }
  }, [preselectedFolderId])

  // Create new folder inline
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return

    setIsCreatingFolder(true)
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error("Not authenticated")

      const { data, error } = await supabase
        .from("project_folders")
        .insert({
          user_id: user.id,
          name: newFolderName.trim(),
        })
        .select()
        .single()

      if (error) throw error

      setFolders(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
      setFolderId(data.id)
      setNewFolderName("")
      toast.success("Folder created")
    } catch {
      toast.error("Failed to create folder")
    } finally {
      setIsCreatingFolder(false)
    }
  }

  // Validation
  const isStep1Valid = projectName.trim().length > 0 && folderId.length > 0
  const isStep2Valid = tradeType.length > 0
  const isStep3Valid = files.length >= MIN_BIDS && files.length <= MAX_BIDS
  // Step 4 (Breakdown) is always valid - users can skip or select AI mode
  const isStep4Valid = true
  const isStep5Valid = contractors.every((c) => c.contractorName.trim().length > 0)

  // When files change, update contractors list
  const handleFilesChange = (newFiles: UploadedFile[]) => {
    setFiles(newFiles)

    // Update contractors to match files
    const newContractors: ContractorInfo[] = newFiles.map((f) => {
      const existing = contractors.find((c) => c.fileId === f.id)
      return (
        existing || {
          fileId: f.id,
          fileName: f.file.name,
          contractorName: "",
        }
      )
    })
    setContractors(newContractors)
  }

  const handleContractorNameChange = (fileId: string, name: string) => {
    setContractors((prev) =>
      prev.map((c) => (c.fileId === fileId ? { ...c, contractorName: name } : c))
    )
  }

  const handleBreakdownChange = (selection: {
    structure: BreakdownStructure | null
    source: BreakdownSource | null
    templateId?: string
  }) => {
    setBreakdownStructure(selection.structure)
    setBreakdownSource(selection.source)
    setBreakdownTemplateId(selection.templateId)
  }

  // Create project early and extract text (for breakdown selection with AI options)
  const createProjectAndExtractText = async () => {
    if (earlyProjectId) return earlyProjectId // Already created

    setIsExtractingText(true)

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        toast.error("Please log in to continue")
        return null
      }

      // 1. Create the project in draft status
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .insert({
          user_id: user.id,
          folder_id: folderId,
          name: projectName,
          trade_type: tradeType,
          status: "draft",
        })
        .select()
        .single()

      if (projectError || !project) {
        throw new Error("Failed to create project")
      }

      setEarlyProjectId(project.id)

      // 2. Upload files and create bid_documents records
      for (const contractor of contractors) {
        const fileData = files.find((f) => f.id === contractor.fileId)
        if (!fileData) continue

        const file = fileData.file
        const fileExt = file.name.split(".").pop()
        const filePath = `${user.id}/${project.id}/${contractor.fileId}.${fileExt}`

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from("bid-documents")
          .upload(filePath, file)

        if (uploadError) {
          console.error("Upload error:", uploadError)
          continue
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from("bid-documents")
          .getPublicUrl(filePath)

        // Create bid_document record
        await supabase.from("bid_documents").insert({
          project_id: project.id,
          contractor_name: contractor.contractorName || `Contractor ${contractors.indexOf(contractor) + 1}`,
          file_name: file.name,
          file_url: urlData.publicUrl,
          file_type: file.type,
          file_size: file.size,
          upload_status: "uploaded",
        })
      }

      // 3. Extract text from documents
      const extractResponse = await fetch(
        `/api/projects/${project.id}/extract-text`,
        { method: "POST" }
      )

      if (!extractResponse.ok) {
        console.error("Text extraction failed")
      } else {
        setTextExtractionComplete(true)
      }

      return project.id
    } catch (error) {
      console.error("Early project creation error:", error)
      toast.error("Failed to prepare documents. Please try again.")
      return null
    } finally {
      setIsExtractingText(false)
    }
  }

  const handleNext = async () => {
    // When moving from step 3 (Upload) to step 4 (Breakdown), create project and extract text
    if (currentStep === 3 && !earlyProjectId) {
      const projectId = await createProjectAndExtractText()
      if (!projectId) return // Failed to create project
    }

    const nextStep = Math.min(currentStep + 1, STEPS.length)
    setCurrentStep(nextStep)

    // Track step progression
    trackComparisonStep(nextStep, STEPS[nextStep - 1].name, STEPS.length)
  }

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)

    try {
      const supabase = createClient()

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        toast.error("Please log in to create a comparison")
        router.push("/login")
        return
      }

      let projectId: string

      // Check if project was already created early (for AI breakdown selection)
      if (earlyProjectId) {
        projectId = earlyProjectId

        // Update contractor names in existing bid_documents
        const { data: existingDocs } = await supabase
          .from("bid_documents")
          .select("id, file_name")
          .eq("project_id", projectId)

        if (existingDocs) {
          for (const doc of existingDocs) {
            // Find the contractor by matching file name
            const contractor = contractors.find(
              (c) => files.find((f) => f.id === c.fileId)?.file.name === doc.file_name
            )
            if (contractor) {
              await supabase
                .from("bid_documents")
                .update({ contractor_name: contractor.contractorName })
                .eq("id", doc.id)
            }
          }
        }

        // Update project with breakdown settings and status
        await supabase
          .from("projects")
          .update({
            status: "processing",
            breakdown_type: breakdownStructure?.type || null,
            breakdown_structure: breakdownStructure || null,
            breakdown_source: breakdownSource,
          })
          .eq("id", projectId)
      } else {
        // Create project the traditional way (fallback)
        const { data: project, error: projectError } = await supabase
          .from("projects")
          .insert({
            user_id: user.id,
            folder_id: folderId,
            name: projectName,
            trade_type: tradeType,
            status: "uploading",
            breakdown_type: breakdownStructure?.type || null,
            breakdown_structure: breakdownStructure || null,
            breakdown_source: breakdownSource,
          })
          .select()
          .single()

        if (projectError || !project) {
          throw new Error("Failed to create project")
        }

        projectId = project.id

        // Upload files to storage and create bid_documents records
        for (const contractor of contractors) {
          const fileData = files.find((f) => f.id === contractor.fileId)
          if (!fileData) continue

          const file = fileData.file
          const fileExt = file.name.split(".").pop()
          const filePath = `${user.id}/${projectId}/${contractor.fileId}.${fileExt}`

          // Upload to storage
          const { error: uploadError } = await supabase.storage
            .from("bid-documents")
            .upload(filePath, file)

          if (uploadError) {
            console.error("Upload error:", uploadError)
            continue
          }

          // Get public URL
          const { data: urlData } = supabase.storage
            .from("bid-documents")
            .getPublicUrl(filePath)

          // Create bid_document record
          await supabase.from("bid_documents").insert({
            project_id: projectId,
            contractor_name: contractor.contractorName,
            file_name: file.name,
            file_url: urlData.publicUrl,
            file_type: file.type,
            file_size: file.size,
            upload_status: "uploaded",
          })
        }

        // Update project status to processing
        await supabase
          .from("projects")
          .update({ status: "processing" })
          .eq("id", projectId)
      }

      // Trigger analysis (fire and forget)
      fetch(`/api/projects/${projectId}/analyze`, {
        method: "POST",
      }).catch(console.error)

      // Track processing started
      trackProcessingStarted({
        comparison_id: projectId,
        document_count: contractors.length,
      })

      toast.success("Comparison created! Analysis is starting...")
      router.push(`/compare/${projectId}`)
    } catch (error) {
      console.error("Submit error:", error)
      toast.error("Failed to create comparison. Please try again.")

      // Track submission error
      trackSubmissionError({
        form_name: 'comparison_wizard',
        error_type: 'submit_failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return isStep1Valid
      case 2:
        return isStep2Valid
      case 3:
        return isStep3Valid
      case 4:
        return isStep4Valid
      case 5:
        return isStep5Valid
      case 6:
        return true
      default:
        return false
    }
  }

  const selectedFolder = folders.find(f => f.id === folderId)

  // Show loading state while checking usage
  if (isLoadingUsage) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  // Show upgrade prompt if user is out of credits
  if (usageStatus && !usageStatus.canCreateComparison) {
    return (
      <div className="mx-auto max-w-2xl py-12">
        <UpgradePrompt creditBalance={usageStatus.creditBalance} />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">New Comparison</h1>
        <p className="mt-2 text-muted-foreground">
          Upload subcontractor bids to compare them side-by-side
        </p>
        {usageStatus && usageStatus.accessType === "credits" && (
          <p className="mt-1 text-sm text-muted-foreground">
            {usageStatus.creditBalance} credit{usageStatus.creditBalance !== 1 ? "s" : ""} remaining
          </p>
        )}
      </div>

      {/* Procore Import Option */}
      {isProcoreConnected && (
        <div className="mb-8 rounded-lg border border-dashed p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary/10 p-2">
                <svg viewBox="0 0 24 24" className="h-5 w-5 text-primary" fill="currentColor">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              <div>
                <p className="font-medium">Import from Procore</p>
                <p className="text-sm text-muted-foreground">
                  Pull bids directly from your Procore projects
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowProcoreModal(true)}
            >
              <Upload className="mr-2 h-4 w-4" />
              Import Bids
            </Button>
          </div>
        </div>
      )}

      <div className="mb-12">
        <StepIndicator steps={STEPS} currentStep={currentStep} />
      </div>

      {/* Procore Import Modal */}
      <ProcoreImportModal
        open={showProcoreModal}
        onOpenChange={setShowProcoreModal}
        folders={folders}
        preselectedFolderId={preselectedFolderId || undefined}
      />

      <Card>
        <CardHeader>
          <CardTitle>{STEPS[currentStep - 1].name}</CardTitle>
          <CardDescription>
            {currentStep === 1 && "Select a project folder and enter comparison details"}
            {currentStep === 2 && "Select the trade or scope type for this comparison"}
            {currentStep === 3 && "Upload the bid documents you want to compare"}
            {currentStep === 4 && "Choose how to organize scope items for comparison"}
            {currentStep === 5 && "Name each contractor for easy identification"}
            {currentStep === 6 && "Review your comparison details before submitting"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Step 1: Project Details */}
          {currentStep === 1 && (
            <div className="space-y-6">
              {/* Folder Selection */}
              <div className="space-y-2">
                <Label>
                  Project Folder <span className="text-destructive">*</span>
                </Label>
                {isLoadingFolders ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading folders...
                  </div>
                ) : folders.length === 0 ? (
                  /* Empty state - no folders yet */
                  <div className="rounded-lg border-2 border-dashed border-muted-foreground/25 p-6">
                    <div className="text-center">
                      <FolderPlus className="mx-auto h-10 w-10 text-muted-foreground/50" />
                      <h3 className="mt-3 font-medium">Create your first project folder</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Folders help you organize comparisons by construction project
                      </p>
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                      <Input
                        placeholder="Enter folder name (e.g., Downtown Office Tower)"
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            handleCreateFolder()
                          }
                        }}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        onClick={handleCreateFolder}
                        disabled={!newFolderName.trim() || isCreatingFolder}
                      >
                        {isCreatingFolder ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <FolderPlus className="mr-2 h-4 w-4" />
                        )}
                        Create Folder
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* Has folders - show dropdown with option to create more */
                  <>
                    <Select value={folderId} onValueChange={setFolderId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a project folder" />
                      </SelectTrigger>
                      <SelectContent>
                        {folders.map((folder) => (
                          <SelectItem key={folder.id} value={folder.id}>
                            {folder.name}
                            {folder.location && ` (${folder.location})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Create new folder inline */}
                    <div className="flex items-center gap-2 pt-2">
                      <Input
                        placeholder="Or create new folder..."
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            handleCreateFolder()
                          }
                        }}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleCreateFolder}
                        disabled={!newFolderName.trim() || isCreatingFolder}
                      >
                        {isCreatingFolder ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <FolderPlus className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Folders help organize comparisons by construction project
                    </p>
                  </>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="projectName">
                  Comparison Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="projectName"
                  placeholder="e.g., Phase 1 Electrical Bids"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                />
              </div>

              {/* Show folder details if selected */}
              {selectedFolder && (selectedFolder.location || selectedFolder.project_size || selectedFolder.client_name) && (
                <div className="rounded-lg bg-muted/50 p-3 text-sm">
                  <p className="font-medium text-muted-foreground">Folder Details</p>
                  <div className="mt-1 space-y-0.5 text-muted-foreground">
                    {selectedFolder.location && <p>Location: {selectedFolder.location}</p>}
                    {selectedFolder.project_size && <p>Size: {selectedFolder.project_size}</p>}
                    {selectedFolder.client_name && <p>Client: {selectedFolder.client_name}</p>}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Trade Type */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>
                  Trade Type <span className="text-destructive">*</span>
                </Label>
                <Select value={tradeType} onValueChange={setTradeType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a trade type" />
                  </SelectTrigger>
                  <SelectContent>
                    {TRADE_TYPES.map((trade) => (
                      <SelectItem key={trade} value={trade}>
                        {trade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  This helps the AI better understand and extract scope items
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Upload Bids */}
          {currentStep === 3 && (
            <FileDropzone
              files={files}
              onFilesChange={handleFilesChange}
              minFiles={MIN_BIDS}
              maxFiles={MAX_BIDS}
            />
          )}

          {/* Step 4: Breakdown Selection */}
          {currentStep === 4 && tradeType && (
            <BreakdownSelectionStep
              tradeType={tradeType}
              projectId={earlyProjectId || undefined}
              onSelectionChange={handleBreakdownChange}
              selectedBreakdown={breakdownStructure}
              selectedSource={breakdownSource}
            />
          )}

          {/* Step 5: Name Contractors */}
          {currentStep === 5 && (
            <div className="space-y-4">
              {contractors.map((contractor, index) => (
                <div key={contractor.fileId} className="space-y-2">
                  <Label htmlFor={`contractor-${index}`}>
                    Contractor for {contractor.fileName}{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id={`contractor-${index}`}
                    placeholder="e.g., ABC Electric"
                    value={contractor.contractorName}
                    onChange={(e) =>
                      handleContractorNameChange(contractor.fileId, e.target.value)
                    }
                  />
                </div>
              ))}
            </div>
          )}

          {/* Step 6: Review */}
          {currentStep === 6 && (
            <div className="space-y-6">
              <div className="rounded-lg bg-muted/50 p-4">
                <h4 className="font-medium">Project Details</h4>
                <dl className="mt-2 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Folder</dt>
                    <dd className="font-medium">{selectedFolder?.name || "—"}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Comparison Name</dt>
                    <dd className="font-medium">{projectName}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Trade</dt>
                    <dd className="font-medium">{tradeType}</dd>
                  </div>
                  {selectedFolder?.location && (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Location</dt>
                      <dd className="font-medium">{selectedFolder.location}</dd>
                    </div>
                  )}
                  {selectedFolder?.project_size && (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Size</dt>
                      <dd className="font-medium">{selectedFolder.project_size}</dd>
                    </div>
                  )}
                  {selectedFolder?.client_name && (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Client</dt>
                      <dd className="font-medium">{selectedFolder.client_name}</dd>
                    </div>
                  )}
                </dl>
              </div>

              <div className="rounded-lg bg-muted/50 p-4">
                <h4 className="font-medium">Breakdown Strategy</h4>
                <dl className="mt-2 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Mode</dt>
                    <dd className="font-medium">
                      {breakdownSource === "ai" && "AI-Powered (analyze documents)"}
                      {breakdownSource === "template" && "Saved Template"}
                      {breakdownSource === null && "No breakdown (flat extraction)"}
                    </dd>
                  </div>
                  {breakdownStructure && (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Categories</dt>
                      <dd className="font-medium">{breakdownStructure.nodes.length} top-level</dd>
                    </div>
                  )}
                </dl>
              </div>

              <div className="rounded-lg bg-muted/50 p-4">
                <h4 className="font-medium">Bids to Compare ({contractors.length})</h4>
                <ul className="mt-2 space-y-2 text-sm">
                  {contractors.map((c) => (
                    <li key={c.fileId} className="flex justify-between">
                      <span className="text-muted-foreground">{c.fileName}</span>
                      <span className="font-medium">{c.contractorName}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="mt-6 flex justify-between">
        <Button
          variant="outline"
          onClick={currentStep === 1 ? () => router.push("/dashboard") : handleBack}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {currentStep === 1 ? "Cancel" : "Back"}
        </Button>

        {currentStep < STEPS.length ? (
          <Button onClick={handleNext} disabled={!canProceed() || isExtractingText}>
            {isExtractingText ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Preparing Documents...
              </>
            ) : (
              <>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Comparison"
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
