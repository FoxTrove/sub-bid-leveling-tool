"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, CheckCircle2, AlertCircle, FileText, RefreshCw, Sparkles, Brain, Zap, BarChart3 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

interface Document {
  id: string
  contractor_name: string
  file_name: string
  upload_status: string
  error_message?: string | null
}

interface ProcessingStateProps {
  projectId: string
  documents: Document[]
}

const AI_THINKING_MESSAGES = [
  "Reading bid documents...",
  "Identifying line items...",
  "Parsing dollar amounts...",
  "Categorizing scope items...",
  "Detecting exclusions...",
  "Cross-referencing bids...",
  "Analyzing price variances...",
  "Identifying scope gaps...",
  "Calculating confidence scores...",
  "Generating insights...",
]

export function ProcessingState({ projectId, documents }: ProcessingStateProps) {
  const router = useRouter()
  const [docs, setDocs] = useState<Document[]>(documents)
  const [progress, setProgress] = useState(10)
  const [currentStep, setCurrentStep] = useState(0)
  const [hasErrors, setHasErrors] = useState(false)
  const [aiMessage, setAiMessage] = useState(AI_THINKING_MESSAGES[0])
  const [itemsExtracted, setItemsExtracted] = useState(0)

  // Cycle through AI thinking messages for visual feedback
  useEffect(() => {
    const messageInterval = setInterval(() => {
      setAiMessage(prev => {
        const currentIndex = AI_THINKING_MESSAGES.indexOf(prev)
        const nextIndex = (currentIndex + 1) % AI_THINKING_MESSAGES.length
        return AI_THINKING_MESSAGES[nextIndex]
      })
    }, 2500)

    return () => clearInterval(messageInterval)
  }, [])

  // Simulate item count increasing for visual feedback
  useEffect(() => {
    if (progress > 20 && progress < 80) {
      const countInterval = setInterval(() => {
        setItemsExtracted(prev => {
          const increment = Math.floor(Math.random() * 3) + 1
          return Math.min(prev + increment, docs.length * 25)
        })
      }, 800)
      return () => clearInterval(countInterval)
    }
  }, [progress, docs.length])

  useEffect(() => {
    const supabase = createClient()

    // Poll for updates every 2 seconds
    const interval = setInterval(async () => {
      const { data: project } = await supabase
        .from("projects")
        .select("status, error_message, bid_documents(id, upload_status, error_message)")
        .eq("id", projectId)
        .single()

      if (project) {
        if (project.status === "complete" || project.status === "error") {
          clearInterval(interval)
          router.refresh()
          return
        }

        const updatedDocs = project.bid_documents as Document[]
        setDocs((prev) =>
          prev.map((d) => {
            const updated = updatedDocs.find((ud) => ud.id === d.id)
            return {
              ...d,
              upload_status: updated?.upload_status || d.upload_status,
              error_message: updated?.error_message || d.error_message,
            }
          })
        )

        // Check for any errors
        const errorDocs = updatedDocs.filter((d) => d.upload_status === "error")
        setHasErrors(errorDocs.length > 0)

        // Calculate progress based on document status
        const processed = updatedDocs.filter(
          (d) => d.upload_status === "processed" || d.upload_status === "error"
        ).length
        const processing = updatedDocs.filter(
          (d) => d.upload_status === "processing"
        ).length
        const total = updatedDocs.length

        // Progress: 10% start, 10-70% for docs, 70-100% for final steps
        const docProgress = ((processed + processing * 0.5) / total) * 60
        const newProgress = Math.min(10 + docProgress, 90)
        setProgress(newProgress)

        // Update step based on progress
        if (processing > 0) {
          setCurrentStep(1)
        } else if (processed === total && processed > 0) {
          setCurrentStep(2)
        }
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [projectId, router])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "processed":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case "processing":
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <FileText className="h-5 w-5 text-muted-foreground" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "processed":
        return "text-green-600 bg-green-50"
      case "processing":
        return "text-blue-600 bg-blue-50"
      case "error":
        return "text-red-600 bg-red-50"
      default:
        return "text-muted-foreground bg-muted"
    }
  }

  const getFriendlyErrorMessage = (error: string | null | undefined): string => {
    if (!error) return "An unexpected error occurred"

    if (error.includes("parse") || error.includes("JSON")) {
      return "Could not read bid format. Try re-uploading in a different format."
    }
    if (error.includes("download") || error.includes("storage")) {
      return "Could not download file. Please try uploading again."
    }
    if (error.includes("OpenAI") || error.includes("API")) {
      return "AI service temporarily unavailable. Please try again in a moment."
    }
    if (error.includes("timeout")) {
      return "Processing took too long. Try with a smaller file."
    }

    return error.length > 100 ? error.substring(0, 100) + "..." : error
  }

  const handleRetry = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/analyze`, {
        method: "POST",
      })
      if (response.ok) {
        router.refresh()
      }
    } catch (error) {
      console.error("Retry failed:", error)
    }
  }

  const getStepInfo = () => {
    const steps = [
      { icon: FileText, label: "Downloading", done: progress > 15 },
      { icon: Brain, label: "Extracting", done: progress > 50 },
      { icon: BarChart3, label: "Comparing", done: progress > 75 },
      { icon: Sparkles, label: "Recommending", done: progress > 90 },
    ]
    return steps
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
        <CardTitle className="flex items-center gap-3">
          <div className="relative">
            <Brain className="h-6 w-6 text-blue-600" />
            <Sparkles className="h-3 w-3 text-amber-500 absolute -top-1 -right-1 animate-pulse" />
          </div>
          <div>
            <span>AI Analysis in Progress</span>
            <p className="text-sm font-normal text-muted-foreground mt-0.5">
              Powered by GPT-4o
            </p>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        {/* AI Activity Indicator */}
        <div className="rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 p-4 text-white">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Zap className="h-5 w-5 animate-pulse" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium opacity-90">AI is thinking...</p>
              <p className="text-white/80 text-sm">{aiMessage}</p>
            </div>
            {itemsExtracted > 0 && (
              <div className="text-right">
                <p className="text-2xl font-bold">{itemsExtracted}</p>
                <p className="text-xs opacity-80">items found</p>
              </div>
            )}
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-between">
          {getStepInfo().map((step, index) => (
            <div key={index} className="flex flex-col items-center gap-1">
              <div className={`rounded-full p-2 ${step.done ? 'bg-green-100 text-green-600' : 'bg-muted text-muted-foreground'}`}>
                {step.done ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <step.icon className="h-4 w-4" />
                )}
              </div>
              <span className={`text-xs ${step.done ? 'text-green-600 font-medium' : 'text-muted-foreground'}`}>
                {step.label}
              </span>
            </div>
          ))}
        </div>

        {/* Progress Bar */}
        <div>
          <div className="mb-2 flex justify-between text-sm">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className={`h-2 ${hasErrors ? "bg-amber-100" : ""}`} />
        </div>

        {/* Document Status */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Bid Documents</p>
          {docs.map((doc) => (
            <div
              key={doc.id}
              className={`rounded-lg border p-3 transition-all ${
                doc.upload_status === "processing" ? "border-blue-200 bg-blue-50/50 shadow-sm" :
                doc.upload_status === "error" ? "border-red-200 bg-red-50" :
                doc.upload_status === "processed" ? "border-green-200 bg-green-50/50" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(doc.upload_status)}
                  <div>
                    <p className="font-medium">{doc.contractor_name}</p>
                    <p className="text-sm text-muted-foreground">{doc.file_name}</p>
                  </div>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(doc.upload_status)}`}>
                  {doc.upload_status === "uploaded" ? "Queued" :
                   doc.upload_status === "processing" ? "Analyzing..." :
                   doc.upload_status === "processed" ? "Complete" :
                   doc.upload_status === "error" ? "Failed" : doc.upload_status}
                </span>
              </div>
              {doc.upload_status === "error" && doc.error_message && (
                <p className="mt-2 text-sm text-red-600">
                  {getFriendlyErrorMessage(doc.error_message)}
                </p>
              )}
            </div>
          ))}
        </div>

        {hasErrors && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
            <p className="text-sm text-amber-800">
              Some bids encountered issues but analysis will continue with the remaining bids.
            </p>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t">
          <p className="text-sm text-muted-foreground">
            Typically completes in 1-2 minutes
          </p>
          {hasErrors && (
            <Button variant="outline" size="sm" onClick={handleRetry}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry Failed
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
