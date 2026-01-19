"use client"

import { useEffect, useRef } from "react"
import {
  trackResultsViewed,
  trackComparisonExported,
} from "@/lib/analytics"

interface ResultsTrackerProps {
  comparisonId: string
  isComplete: boolean
  completedAt?: string | null
}

/**
 * Client component to track results page analytics
 * Placed in the results page to track when results are viewed
 */
export function ResultsTracker({
  comparisonId,
  isComplete,
  completedAt,
}: ResultsTrackerProps) {
  const hasTracked = useRef(false)

  useEffect(() => {
    if (isComplete && !hasTracked.current) {
      hasTracked.current = true

      // Calculate time since completion
      let timeSinceCompletion: number | undefined
      if (completedAt) {
        const completedDate = new Date(completedAt)
        timeSinceCompletion = Math.round(
          (Date.now() - completedDate.getTime()) / 1000
        )
      }

      trackResultsViewed({
        comparison_id: comparisonId,
        time_since_completion_seconds: timeSinceCompletion,
      })
    }
  }, [comparisonId, isComplete, completedAt])

  return null
}

interface ExportButtonProps {
  comparisonId: string
  format: "pdf" | "csv"
  href: string
  children: React.ReactNode
  className?: string
}

/**
 * Wrapper component for export buttons that tracks clicks
 */
export function TrackedExportLink({
  comparisonId,
  format,
  href,
  children,
  className,
}: ExportButtonProps) {
  const handleClick = () => {
    trackComparisonExported({
      comparison_id: comparisonId,
      format,
    })
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className={className}
    >
      {children}
    </a>
  )
}
