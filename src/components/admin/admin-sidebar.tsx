"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  BarChart3,
  GraduationCap,
  Settings,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Activity,
  FileText,
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
}

const navItems: NavItem[] = [
  {
    title: "Overview",
    href: "/admin/overview",
    icon: LayoutDashboard,
  },
  {
    title: "Users",
    href: "/admin/users",
    icon: Users,
  },
  {
    title: "Analytics",
    href: "/admin/analytics",
    icon: BarChart3,
    children: [
      {
        title: "Business",
        href: "/admin/analytics/business",
        icon: TrendingUp,
      },
      {
        title: "Usage",
        href: "/admin/analytics/usage",
        icon: Activity,
      },
      {
        title: "AI Quality",
        href: "/admin/analytics/ai-quality",
        icon: BarChart3,
      },
    ],
  },
  {
    title: "Training",
    href: "/admin/training",
    icon: GraduationCap,
    children: [
      {
        title: "Moderation",
        href: "/admin/training",
        icon: FileText,
      },
      {
        title: "Prompts",
        href: "/admin/training/prompts",
        icon: FileText,
      },
      {
        title: "Exports",
        href: "/admin/training/exports",
        icon: FileText,
      },
    ],
  },
  {
    title: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = React.useState(false)
  const [expandedSections, setExpandedSections] = React.useState<string[]>([])

  // Load collapsed state from localStorage on mount
  React.useEffect(() => {
    const stored = localStorage.getItem("admin-sidebar-collapsed")
    if (stored !== null) {
      setIsCollapsed(stored === "true")
    }

    // Auto-expand sections based on current path
    navItems.forEach(item => {
      if (item.children && item.children.some(child => pathname.startsWith(child.href))) {
        setExpandedSections(prev => [...new Set([...prev, item.href])])
      }
    })
  }, [pathname])

  const toggleCollapsed = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    localStorage.setItem("admin-sidebar-collapsed", String(newState))
  }

  const toggleSection = (href: string) => {
    setExpandedSections(prev =>
      prev.includes(href)
        ? prev.filter(h => h !== href)
        : [...prev, href]
    )
  }

  const isActive = (href: string) => {
    if (href === "/admin/overview") {
      return pathname === "/admin/overview" || pathname === "/admin"
    }
    return pathname === href || pathname.startsWith(href + "/")
  }

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "flex flex-col fixed left-0 top-16 h-[calc(100vh-4rem)] bg-slate-900 border-r border-slate-700 z-40",
          "transition-all duration-200 ease-in-out",
          isCollapsed ? "w-16" : "w-56"
        )}
      >
        {/* Admin badge */}
        <div className={cn(
          "px-4 py-3 border-b border-slate-700",
          isCollapsed && "px-2 flex justify-center"
        )}>
          {!isCollapsed ? (
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded bg-amber-500 flex items-center justify-center">
                <span className="text-xs font-bold text-slate-900">A</span>
              </div>
              <span className="text-sm font-semibold text-amber-500">Admin Panel</span>
            </div>
          ) : (
            <div className="h-6 w-6 rounded bg-amber-500 flex items-center justify-center">
              <span className="text-xs font-bold text-slate-900">A</span>
            </div>
          )}
        </div>

        <nav className="flex-1 flex flex-col gap-1 p-2 pt-4 overflow-y-auto">
          {navItems.map((item) => {
            const active = isActive(item.href)
            const hasChildren = item.children && item.children.length > 0
            const isExpanded = expandedSections.includes(item.href)

            if (isCollapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>
                    <Link
                      href={hasChildren ? item.children![0].href : item.href}
                      className={cn(
                        "flex items-center justify-center rounded-lg p-3 transition-colors",
                        "hover:bg-slate-800 hover:text-slate-100",
                        active
                          ? "bg-slate-800 text-amber-500"
                          : "text-slate-400"
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="font-medium">
                    {item.title}
                  </TooltipContent>
                </Tooltip>
              )
            }

            return (
              <div key={item.href}>
                {hasChildren ? (
                  <>
                    <button
                      onClick={() => toggleSection(item.href)}
                      className={cn(
                        "w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        "hover:bg-slate-800 hover:text-slate-100",
                        active
                          ? "bg-slate-800 text-amber-500"
                          : "text-slate-400"
                      )}
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      <span className="truncate flex-1 text-left">{item.title}</span>
                      <ChevronRight
                        className={cn(
                          "h-4 w-4 transition-transform",
                          isExpanded && "rotate-90"
                        )}
                      />
                    </button>
                    {isExpanded && (
                      <div className="ml-4 mt-1 flex flex-col gap-1">
                        {item.children!.map((child) => {
                          const childActive = pathname === child.href
                          return (
                            <Link
                              key={child.href}
                              href={child.href}
                              className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                                "hover:bg-slate-800 hover:text-slate-100",
                                childActive
                                  ? "bg-slate-800/50 text-amber-400"
                                  : "text-slate-400"
                              )}
                            >
                              <span className="truncate">{child.title}</span>
                            </Link>
                          )
                        })}
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      "hover:bg-slate-800 hover:text-slate-100",
                      active
                        ? "bg-slate-800 text-amber-500"
                        : "text-slate-400"
                    )}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    <span className="truncate">{item.title}</span>
                  </Link>
                )}
              </div>
            )
          })}
        </nav>

        {/* Back to app link */}
        <div className="p-2 border-t border-slate-700">
          <Link
            href="/dashboard"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              "hover:bg-slate-800 text-slate-400 hover:text-slate-100",
              isCollapsed && "justify-center"
            )}
          >
            <ChevronLeft className="h-5 w-5 shrink-0" />
            {!isCollapsed && <span className="truncate">Back to App</span>}
          </Link>
        </div>

        {/* Collapse toggle button */}
        <div className="p-2 border-t border-slate-700">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleCollapsed}
            className={cn(
              "w-full justify-center transition-colors text-slate-400 hover:text-slate-100 hover:bg-slate-800",
              !isCollapsed && "justify-start gap-3 px-3"
            )}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4" />
                <span className="text-sm">Collapse</span>
              </>
            )}
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  )
}
