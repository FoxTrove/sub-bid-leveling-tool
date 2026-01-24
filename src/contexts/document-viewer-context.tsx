'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import type { BidDocument, ExtractedItem, TextPosition } from '@/types'

// ============================================
// Types
// ============================================

interface HighlightedItem {
  item: ExtractedItem
  documentId: string
}

interface HighlightedPosition {
  position: TextPosition
  documentId: string
}

interface DocumentViewerState {
  // Panel state
  isOpen: boolean
  panelWidth: number // percentage (0-100)

  // Active document
  activeDocument: BidDocument | null

  // Bidirectional highlighting
  highlightedItem: HighlightedItem | null // Grid item highlighted (shows in document)
  highlightedPosition: HighlightedPosition | null // Document position highlighted (shows in grid)

  // Navigation
  currentPage: number
  totalPages: number
  zoom: number // percentage (50-200)

  // Loading state
  isLoading: boolean
}

interface DocumentViewerActions {
  // Panel controls
  openPanel: () => void
  closePanel: () => void
  togglePanel: () => void
  setPanelWidth: (width: number) => void

  // Document selection
  setActiveDocument: (document: BidDocument | null) => void

  // Bidirectional highlighting - Grid to Document
  highlightItemInDocument: (item: ExtractedItem, documentId: string) => void
  clearItemHighlight: () => void

  // Bidirectional highlighting - Document to Grid
  highlightPositionInGrid: (position: TextPosition, documentId: string) => void
  clearPositionHighlight: () => void

  // Clear all highlights
  clearAllHighlights: () => void

  // Navigation
  setCurrentPage: (page: number) => void
  nextPage: () => void
  prevPage: () => void
  setTotalPages: (total: number) => void
  setZoom: (zoom: number) => void
  zoomIn: () => void
  zoomOut: () => void
  resetZoom: () => void

  // Loading
  setLoading: (loading: boolean) => void
}

type DocumentViewerContextType = DocumentViewerState & DocumentViewerActions

// ============================================
// Context
// ============================================

const DocumentViewerContext = createContext<DocumentViewerContextType | null>(null)

// ============================================
// Default state
// ============================================

const DEFAULT_STATE: DocumentViewerState = {
  isOpen: false,
  panelWidth: 40, // 40% of screen width
  activeDocument: null,
  highlightedItem: null,
  highlightedPosition: null,
  currentPage: 1,
  totalPages: 1,
  zoom: 100,
  isLoading: false,
}

// ============================================
// Provider
// ============================================

interface DocumentViewerProviderProps {
  children: ReactNode
}

export function DocumentViewerProvider({ children }: DocumentViewerProviderProps) {
  const [state, setState] = useState<DocumentViewerState>(DEFAULT_STATE)

  // Panel controls
  const openPanel = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: true }))
  }, [])

  const closePanel = useCallback(() => {
    setState(prev => ({
      ...prev,
      isOpen: false,
      highlightedItem: null,
      highlightedPosition: null,
    }))
  }, [])

  const togglePanel = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: !prev.isOpen }))
  }, [])

  const setPanelWidth = useCallback((width: number) => {
    // Clamp between 20% and 70%
    const clampedWidth = Math.max(20, Math.min(70, width))
    setState(prev => ({ ...prev, panelWidth: clampedWidth }))
  }, [])

  // Document selection
  const setActiveDocument = useCallback((document: BidDocument | null) => {
    setState(prev => ({
      ...prev,
      activeDocument: document,
      currentPage: 1,
      totalPages: 1,
      highlightedItem: null,
      highlightedPosition: null,
    }))
  }, [])

  // Bidirectional highlighting - Grid to Document
  const highlightItemInDocument = useCallback((item: ExtractedItem, documentId: string) => {
    setState(prev => ({
      ...prev,
      highlightedItem: { item, documentId },
      highlightedPosition: null, // Clear opposite direction
    }))
  }, [])

  const clearItemHighlight = useCallback(() => {
    setState(prev => ({ ...prev, highlightedItem: null }))
  }, [])

  // Bidirectional highlighting - Document to Grid
  const highlightPositionInGrid = useCallback((position: TextPosition, documentId: string) => {
    setState(prev => ({
      ...prev,
      highlightedPosition: { position, documentId },
      highlightedItem: null, // Clear opposite direction
    }))
  }, [])

  const clearPositionHighlight = useCallback(() => {
    setState(prev => ({ ...prev, highlightedPosition: null }))
  }, [])

  // Clear all highlights
  const clearAllHighlights = useCallback(() => {
    setState(prev => ({
      ...prev,
      highlightedItem: null,
      highlightedPosition: null,
    }))
  }, [])

  // Navigation
  const setCurrentPage = useCallback((page: number) => {
    setState(prev => ({
      ...prev,
      currentPage: Math.max(1, Math.min(page, prev.totalPages)),
    }))
  }, [])

  const nextPage = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentPage: Math.min(prev.currentPage + 1, prev.totalPages),
    }))
  }, [])

  const prevPage = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentPage: Math.max(prev.currentPage - 1, 1),
    }))
  }, [])

  const setTotalPages = useCallback((total: number) => {
    setState(prev => ({ ...prev, totalPages: Math.max(1, total) }))
  }, [])

  const setZoom = useCallback((zoom: number) => {
    // Clamp between 50% and 200%
    const clampedZoom = Math.max(50, Math.min(200, zoom))
    setState(prev => ({ ...prev, zoom: clampedZoom }))
  }, [])

  const zoomIn = useCallback(() => {
    setState(prev => ({ ...prev, zoom: Math.min(prev.zoom + 25, 200) }))
  }, [])

  const zoomOut = useCallback(() => {
    setState(prev => ({ ...prev, zoom: Math.max(prev.zoom - 25, 50) }))
  }, [])

  const resetZoom = useCallback(() => {
    setState(prev => ({ ...prev, zoom: 100 }))
  }, [])

  // Loading
  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, isLoading: loading }))
  }, [])

  const value: DocumentViewerContextType = {
    ...state,
    openPanel,
    closePanel,
    togglePanel,
    setPanelWidth,
    setActiveDocument,
    highlightItemInDocument,
    clearItemHighlight,
    highlightPositionInGrid,
    clearPositionHighlight,
    clearAllHighlights,
    setCurrentPage,
    nextPage,
    prevPage,
    setTotalPages,
    setZoom,
    zoomIn,
    zoomOut,
    resetZoom,
    setLoading,
  }

  return (
    <DocumentViewerContext.Provider value={value}>
      {children}
    </DocumentViewerContext.Provider>
  )
}

// ============================================
// Hook
// ============================================

export function useDocumentViewer() {
  const context = useContext(DocumentViewerContext)
  if (!context) {
    throw new Error('useDocumentViewer must be used within a DocumentViewerProvider')
  }
  return context
}

// ============================================
// Utility hooks
// ============================================

/**
 * Check if a specific item is currently highlighted
 */
export function useIsItemHighlighted(itemId: string) {
  const { highlightedItem } = useDocumentViewer()
  return highlightedItem?.item.id === itemId
}

/**
 * Check if a position matches the highlighted position
 */
export function useIsPositionHighlighted(position: TextPosition) {
  const { highlightedPosition } = useDocumentViewer()
  if (!highlightedPosition) return false

  const hp = highlightedPosition.position

  // Compare based on position type
  if (hp.type !== position.type) return false

  switch (hp.type) {
    case 'pdf':
      return (
        hp.page === (position as typeof hp).page &&
        Math.abs(hp.x - (position as typeof hp).x) < 5 &&
        Math.abs(hp.y - (position as typeof hp).y) < 5
      )
    case 'excel':
      return (
        hp.sheet === (position as typeof hp).sheet &&
        hp.row === (position as typeof hp).row &&
        hp.col === (position as typeof hp).col
      )
    case 'word':
      return (
        hp.paragraph === (position as typeof hp).paragraph &&
        hp.charStart === (position as typeof hp).charStart &&
        hp.charEnd === (position as typeof hp).charEnd
      )
    default:
      return false
  }
}
