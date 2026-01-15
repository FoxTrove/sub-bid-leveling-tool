"use client"

import { useCallback, useState } from "react"
import { useDropzone, type FileRejection } from "react-dropzone"
import { Upload, X, FileText, FileSpreadsheet, File } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { formatFileSize } from "@/lib/utils/format"
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE, MAX_BIDS, MIN_BIDS } from "@/lib/utils/constants"

export interface UploadedFile {
  id: string
  file: File
  progress: number
  status: "pending" | "uploading" | "complete" | "error"
  error?: string
}

interface FileDropzoneProps {
  files: UploadedFile[]
  onFilesChange: (files: UploadedFile[]) => void
  maxFiles?: number
  minFiles?: number
}

function getFileIcon(fileType: string) {
  if (fileType.includes("pdf")) {
    return <FileText className="h-8 w-8 text-red-500" />
  }
  if (fileType.includes("spreadsheet") || fileType.includes("excel") || fileType.includes("csv")) {
    return <FileSpreadsheet className="h-8 w-8 text-green-500" />
  }
  if (fileType.includes("word") || fileType.includes("document")) {
    return <FileText className="h-8 w-8 text-blue-500" />
  }
  return <File className="h-8 w-8 text-muted-foreground" />
}

export function FileDropzone({
  files,
  onFilesChange,
  maxFiles = MAX_BIDS,
  minFiles = MIN_BIDS,
}: FileDropzoneProps) {
  const [dragError, setDragError] = useState<string | null>(null)

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      setDragError(null)

      // Check for rejected files
      if (rejectedFiles.length > 0) {
        const errors = rejectedFiles[0].errors.map((e) => e.message).join(", ")
        setDragError(errors)
        return
      }

      // Check if we're exceeding max files
      const totalFiles = files.length + acceptedFiles.length
      if (totalFiles > maxFiles) {
        setDragError(`Maximum ${maxFiles} files allowed`)
        return
      }

      // Add new files
      const newFiles: UploadedFile[] = acceptedFiles.map((file) => ({
        id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file,
        progress: 0,
        status: "pending",
      }))

      onFilesChange([...files, ...newFiles])
    },
    [files, onFilesChange, maxFiles]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ALLOWED_FILE_TYPES,
    maxSize: MAX_FILE_SIZE,
    maxFiles: maxFiles - files.length,
    disabled: files.length >= maxFiles,
  })

  const removeFile = (id: string) => {
    onFilesChange(files.filter((f) => f.id !== id))
  }

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`relative cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
          isDragActive
            ? "border-primary bg-primary/5"
            : files.length >= maxFiles
              ? "cursor-not-allowed border-muted bg-muted/20"
              : "border-muted-foreground/25 hover:border-primary hover:bg-muted/50"
        }`}
      >
        <input {...getInputProps()} />

        <div className="flex flex-col items-center">
          <Upload
            className={`h-10 w-10 ${
              isDragActive ? "text-primary" : "text-muted-foreground"
            }`}
          />
          <p className="mt-4 text-lg font-medium">
            {isDragActive
              ? "Drop files here"
              : files.length >= maxFiles
                ? "Maximum files reached"
                : "Drag & drop bid documents here"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            or click to select files
          </p>
          <p className="mt-4 text-xs text-muted-foreground">
            Supports PDF, Excel (.xlsx, .xls, .csv), and Word (.docx, .doc) files
            up to 25MB
          </p>
        </div>
      </div>

      {dragError && (
        <p className="text-sm text-destructive">{dragError}</p>
      )}

      <p className="text-sm text-muted-foreground">
        {files.length} of {minFiles}-{maxFiles} files selected
        {files.length < minFiles && (
          <span className="text-amber-600">
            {" "}
            (need at least {minFiles - files.length} more)
          </span>
        )}
      </p>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-3 rounded-lg border bg-card p-3"
            >
              {getFileIcon(file.file.type)}

              <div className="flex-1 min-w-0">
                <p className="truncate font-medium">{file.file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(file.file.size)}
                </p>
                {file.status === "uploading" && (
                  <Progress value={file.progress} className="mt-1 h-1" />
                )}
                {file.status === "error" && (
                  <p className="text-xs text-destructive">{file.error}</p>
                )}
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation()
                  removeFile(file.id)
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
