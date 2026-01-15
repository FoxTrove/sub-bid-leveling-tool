"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, CheckCircle2, AlertCircle, FileText } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { createClient } from "@/lib/supabase/client"

interface Document {
  id: string
  contractor_name: string
  file_name: string
  upload_status: string
}

interface ProcessingStateProps {
  projectId: string
  documents: Document[]
}

export function ProcessingState({ projectId, documents }: ProcessingStateProps) {
  const router = useRouter()
  const [docs, setDocs] = useState(documents)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const supabase = createClient()

    // Poll for updates every 3 seconds
    const interval = setInterval(async () => {
      const { data: project } = await supabase
        .from("projects")
        .select("status, bid_documents(id, upload_status)")
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
          prev.map((d) => ({
            ...d,
            upload_status:
              updatedDocs.find((ud) => ud.id === d.id)?.upload_status ||
              d.upload_status,
          }))
        )

        // Calculate progress
        const processed = updatedDocs.filter(
          (d) => d.upload_status === "processed"
        ).length
        const total = updatedDocs.length
        setProgress((processed / total) * 80 + 10) // 10-90% for docs, leave room for final steps
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [projectId, router])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "processed":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case "processing":
        return <Loader2 className="h-5 w-5 animate-spin text-primary" />
      case "error":
        return <AlertCircle className="h-5 w-5 text-destructive" />
      default:
        return <FileText className="h-5 w-5 text-muted-foreground" />
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          Analyzing Your Bids
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <div className="mb-2 flex justify-between text-sm">
            <span>Overall Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} />
        </div>

        <div className="space-y-3">
          {docs.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <div className="flex items-center gap-3">
                {getStatusIcon(doc.upload_status)}
                <div>
                  <p className="font-medium">{doc.contractor_name}</p>
                  <p className="text-sm text-muted-foreground">{doc.file_name}</p>
                </div>
              </div>
              <span className="text-sm capitalize text-muted-foreground">
                {doc.upload_status.replace("_", " ")}
              </span>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-muted-foreground">
          This typically takes 1-2 minutes. You can leave this page and come back
          later.
        </p>
      </CardContent>
    </Card>
  )
}
