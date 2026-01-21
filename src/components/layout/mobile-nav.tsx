"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  PlusCircle,
  Settings,
  Users,
  Menu,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

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

interface MobileNavProps {
  hasTeam?: boolean
}

export function MobileNav({ hasTeam = false }: MobileNavProps) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = React.useState(false)

  // Close sheet when route changes
  React.useEffect(() => {
    setIsOpen(false)
  }, [pathname])

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
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="border-b border-border/40 p-4">
          <SheetTitle className="flex items-center">
            <Image
              src="/bidvet-logo.png"
              alt="BidVet"
              width={120}
              height={35}
              className="h-7 w-auto dark:hidden"
            />
            <Image
              src="/bidvet-logo-light.png"
              alt="BidVet"
              width={120}
              height={35}
              className="h-7 w-auto hidden dark:block"
            />
          </SheetTitle>
        </SheetHeader>

        <nav className="flex flex-col gap-1 p-4">
          {navItems.map((item) => {
            const active = isActive(item.href)

            return (
              <div key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    "hover:bg-accent hover:text-accent-foreground",
                    active
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  <span>{item.title}</span>
                </Link>

                {/* Nested items (Team under Settings) */}
                {item.children && (
                  <div className="ml-4 mt-1 flex flex-col gap-1">
                    {item.children
                      .filter((child) => !child.showForTeam || hasTeam)
                      .map((child) => {
                        const childActive = isActive(child.href)
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={() => setIsOpen(false)}
                            className={cn(
                              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                              "hover:bg-accent hover:text-accent-foreground",
                              childActive
                                ? "bg-accent/50 text-accent-foreground"
                                : "text-muted-foreground"
                            )}
                          >
                            <child.icon className="h-4 w-4 shrink-0" />
                            <span>{child.title}</span>
                          </Link>
                        )
                      })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>
      </SheetContent>
    </Sheet>
  )
}
