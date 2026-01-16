"use client"

import { useEffect, useRef, useCallback } from "react"

interface Point {
  x: number
  y: number
  originalX: number
  originalY: number
}

export function WarpGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number | null>(null)
  const mouseRef = useRef({ x: -1000, y: -1000 })
  const targetMouseRef = useRef({ x: -1000, y: -1000 })
  const isHoveringRef = useRef(false)
  const pointsRef = useRef<Point[][]>([])

  const gridSpacing = 45
  const warpRadius = 180
  const warpStrength = 30

  const initializeGrid = useCallback((width: number, height: number) => {
    const cols = Math.ceil(width / gridSpacing) + 2
    const rows = Math.ceil(height / gridSpacing) + 2
    const points: Point[][] = []

    for (let row = 0; row < rows; row++) {
      points[row] = []
      for (let col = 0; col < cols; col++) {
        const x = col * gridSpacing
        const y = row * gridSpacing
        points[row][col] = { x, y, originalX: x, originalY: y }
      }
    }

    pointsRef.current = points
  }, [])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return

    const points = pointsRef.current
    if (points.length === 0) {
      animationRef.current = requestAnimationFrame(draw)
      return
    }

    // Smooth mouse following
    const easing = 0.1
    mouseRef.current.x += (targetMouseRef.current.x - mouseRef.current.x) * easing
    mouseRef.current.y += (targetMouseRef.current.y - mouseRef.current.y) * easing

    const mouseX = mouseRef.current.x
    const mouseY = mouseRef.current.y

    // Update point positions with warp effect
    for (let row = 0; row < points.length; row++) {
      for (let col = 0; col < points[row].length; col++) {
        const point = points[row][col]
        const dx = point.originalX - mouseX
        const dy = point.originalY - mouseY
        const distance = Math.sqrt(dx * dx + dy * dy)

        if (distance < warpRadius && isHoveringRef.current) {
          // Calculate warp - push points away from cursor
          const force = (1 - distance / warpRadius) * warpStrength
          const angle = Math.atan2(dy, dx)

          // Smooth falloff
          const falloff = Math.pow(1 - distance / warpRadius, 2)

          point.x = point.originalX + Math.cos(angle) * force * falloff
          point.y = point.originalY + Math.sin(angle) * force * falloff
        } else {
          // Ease back to original position
          point.x += (point.originalX - point.x) * 0.06
          point.y += (point.originalY - point.y) * 0.06
        }
      }
    }

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw grid lines with varying opacity based on warp
    // Horizontal lines
    for (let row = 0; row < points.length; row++) {
      ctx.beginPath()
      ctx.strokeStyle = "rgba(59, 130, 246, 0.06)" // blue-500, subtle
      ctx.lineWidth = 0.5

      for (let col = 0; col < points[row].length; col++) {
        const point = points[row][col]

        // Check if this point is warped - make warped lines more visible
        const distFromMouse = Math.sqrt(
          Math.pow(point.x - mouseX, 2) + Math.pow(point.y - mouseY, 2)
        )

        if (distFromMouse < warpRadius && isHoveringRef.current) {
          ctx.strokeStyle = "rgba(96, 165, 250, 0.25)" // blue-400, brighter on hover
          ctx.lineWidth = 1
        }

        if (col === 0) {
          ctx.moveTo(point.x, point.y)
        } else {
          ctx.lineTo(point.x, point.y)
        }
      }
      ctx.stroke()
    }

    // Vertical lines
    for (let col = 0; col < (points[0]?.length || 0); col++) {
      ctx.beginPath()
      ctx.strokeStyle = "rgba(59, 130, 246, 0.06)" // blue-500, subtle
      ctx.lineWidth = 0.5

      for (let row = 0; row < points.length; row++) {
        const point = points[row][col]

        const distFromMouse = Math.sqrt(
          Math.pow(point.x - mouseX, 2) + Math.pow(point.y - mouseY, 2)
        )

        if (distFromMouse < warpRadius && isHoveringRef.current) {
          ctx.strokeStyle = "rgba(96, 165, 250, 0.25)" // blue-400, brighter on hover
          ctx.lineWidth = 1
        }

        if (row === 0) {
          ctx.moveTo(point.x, point.y)
        } else {
          ctx.lineTo(point.x, point.y)
        }
      }
      ctx.stroke()
    }

    // Draw glow at cursor position when hovering
    if (isHoveringRef.current && mouseX > 0 && mouseY > 0) {
      const gradient = ctx.createRadialGradient(
        mouseX, mouseY, 0,
        mouseX, mouseY, warpRadius * 1.5
      )
      gradient.addColorStop(0, "rgba(59, 130, 246, 0.08)")
      gradient.addColorStop(0.4, "rgba(59, 130, 246, 0.02)")
      gradient.addColorStop(1, "transparent")

      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw intersection points near cursor
      for (let row = 0; row < points.length; row++) {
        for (let col = 0; col < points[row].length; col++) {
          const point = points[row][col]
          const dist = Math.sqrt(
            Math.pow(point.x - mouseX, 2) + Math.pow(point.y - mouseY, 2)
          )
          if (dist < warpRadius) {
            const intensity = 1 - dist / warpRadius
            const size = intensity * 3 + 1
            ctx.fillStyle = `rgba(96, 165, 250, ${intensity * 0.35})`
            ctx.beginPath()
            ctx.arc(point.x, point.y, size, 0, Math.PI * 2)
            ctx.fill()
          }
        }
      }
    }

    animationRef.current = requestAnimationFrame(draw)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    // Find the parent section element to listen for mouse events
    const section = container.closest("section")
    if (!section) return

    const updateCanvasSize = () => {
      const rect = container.getBoundingClientRect()
      canvas.width = rect.width
      canvas.height = rect.height
      initializeGrid(rect.width, rect.height)
    }

    const resizeObserver = new ResizeObserver(() => {
      updateCanvasSize()
    })

    resizeObserver.observe(container)
    updateCanvasSize()

    // Listen on the section element (which has pointer events)
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect()
      targetMouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      }
    }

    const handleMouseEnter = () => {
      isHoveringRef.current = true
    }

    const handleMouseLeave = () => {
      isHoveringRef.current = false
      targetMouseRef.current = { x: -1000, y: -1000 }
    }

    section.addEventListener("mousemove", handleMouseMove)
    section.addEventListener("mouseenter", handleMouseEnter)
    section.addEventListener("mouseleave", handleMouseLeave)

    // Start animation
    animationRef.current = requestAnimationFrame(draw)

    return () => {
      resizeObserver.disconnect()
      section.removeEventListener("mousemove", handleMouseMove)
      section.removeEventListener("mouseenter", handleMouseEnter)
      section.removeEventListener("mouseleave", handleMouseLeave)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [initializeGrid, draw])

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden pointer-events-none">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
      />
    </div>
  )
}
