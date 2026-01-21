"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  PlusCircle,
  Settings,
  Users,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface NavItem {
  title: string
  href: string
  icon: React.ElementType
  children?: NavItem[]
  showForTeam?: boolean
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard
  },
  {
    title: "New Comparison",
    href: "/compare/new",
    icon: PlusCircle
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
    children: [
      {
        title: "Team",
        href: "/settings?tab=team",
        icon: Users,
        showForTeam: true
      }
    ]
  },
]

interface SidebarNavProps {
  hasTeam?: boolean
}

export function SidebarNav({ hasTeam = false }: SidebarNavProps) {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = React.useState(true)
  const [isHovered, setIsHovered] = React.useState(false)

  // Load collapsed state from localStorage on mount
  React.useEffect(() => {
    const stored = localStorage.getItem("sidebar-collapsed")
    if (stored !== null) {
      setIsCollapsed(stored === "true")
    }
  }, [])

  // Save collapsed state to localStorage
  const toggleCollapsed = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    localStorage.setItem("sidebar-collapsed", String(newState))
  }

  // Determine if sidebar should show expanded state
  const isExpanded = !isCollapsed || isHovered

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard"
    }
    if (href.includes("?")) {
      const basePath = href.split("?")[0]
      return pathname === basePath || pathname.startsWith(basePath + "/")
    }
    return pathname === href || pathname.startsWith(href + "/")
  }

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "hidden md:flex flex-col fixed left-0 top-16 h-[calc(100vh-4rem)] bg-background border-r border-border/40 z-40",
          "transition-all duration-200 ease-in-out",
          isExpanded ? "w-60" : "w-16"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <nav className="flex-1 flex flex-col gap-1 p-2 pt-4">
          {navItems.map((item) => {
            const active = isActive(item.href)

            return (
              <div key={item.href}>
                {isExpanded ? (
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      "hover:bg-accent hover:text-accent-foreground",
                      active
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    <span className="truncate">{item.title}</span>
                  </Link>
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center justify-center rounded-lg p-3 transition-colors",
                          "hover:bg-accent hover:text-accent-foreground",
                          active
                            ? "bg-accent text-accent-foreground"
                            : "text-muted-foreground"
                        )}
                      >
                        <item.icon className="h-5 w-5" />
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="font-medium">
                      {item.title}
                    </TooltipContent>
                  </Tooltip>
                )}

                {/* Nested items (Team under Settings) */}
                {item.children && isExpanded && (
                  <div className="ml-4 mt-1 flex flex-col gap-1">
                    {item.children
                      .filter((child) => !child.showForTeam || hasTeam)
                      .map((child) => {
                        const childActive = isActive(child.href)
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            className={cn(
                              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                              "hover:bg-accent hover:text-accent-foreground",
                              childActive
                                ? "bg-accent/50 text-accent-foreground"
                                : "text-muted-foreground"
                            )}
                          >
                            <child.icon className="h-4 w-4 shrink-0" />
                            <span className="truncate">{child.title}</span>
                          </Link>
                        )
                      })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* Collapse toggle button */}
        <div className="p-2 border-t border-border/40">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleCollapsed}
            className={cn(
              "w-full justify-center transition-colors",
              isExpanded && "justify-start gap-3 px-3"
            )}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
            {isExpanded && (
              <span className="text-sm text-muted-foreground">
                {isCollapsed ? "Expand" : "Collapse"}
              </span>
            )}
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  )
}
