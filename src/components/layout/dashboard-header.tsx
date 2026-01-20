"use client"

import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { LogOut, Settings, Key, Sparkles, Coins, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { FREE_COMPARISON_LIMIT } from "@/lib/utils/constants"
import { getPlanDisplayName, getPlanBadgeColor } from "@/lib/utils/subscription"
import type { PlanType } from "@/types"

interface PlanInfo {
  plan: string
  isActive: boolean
  hasApiKey: boolean
  comparisonsUsed: number
  creditBalance: number
}

interface DashboardHeaderProps {
  userEmail?: string
  planInfo?: PlanInfo
}

export function DashboardHeader({ userEmail, planInfo }: DashboardHeaderProps) {
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  const initials = userEmail
    ? userEmail
        .split("@")[0]
        .split(".")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U"

  // Determine plan display
  const getPlanBadge = () => {
    if (!planInfo) return null

    if (planInfo.hasApiKey) {
      return (
        <Badge variant="outline" className="gap-1">
          <Key className="h-3 w-3" />
          BYOK
        </Badge>
      )
    }

    const plan = planInfo.plan as PlanType
    if (plan !== "free" && planInfo.isActive) {
      return (
        <Badge className={getPlanBadgeColor(plan)}>
          <Sparkles className="mr-1 h-3 w-3" />
          {getPlanDisplayName(plan)}
        </Badge>
      )
    }

    // Credit-based user - show credit balance
    if (planInfo.creditBalance > 0) {
      return (
        <Badge variant="secondary" className="gap-1 bg-accent/10 text-accent border-accent/20">
          <Coins className="h-3 w-3" />
          {planInfo.creditBalance} {planInfo.creditBalance === 1 ? 'credit' : 'credits'}
        </Badge>
      )
    }

    // Free plan with no credits - show free usage
    const remaining = FREE_COMPARISON_LIMIT - planInfo.comparisonsUsed
    if (remaining > 0) {
      return (
        <Badge variant="secondary" className="gap-1">
          {remaining}/{FREE_COMPARISON_LIMIT} free
        </Badge>
      )
    }

    // No credits or free comparisons left
    return (
      <Badge variant="outline" className="gap-1 text-muted-foreground">
        No credits
      </Badge>
    )
  }

  // Check if user needs credits
  const needsCredits = planInfo &&
    !planInfo.hasApiKey &&
    !planInfo.isActive &&
    planInfo.creditBalance <= 0 &&
    (FREE_COMPARISON_LIMIT - planInfo.comparisonsUsed) <= 0

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/dashboard" className="flex items-center group">
          <Image
            src="/bidlevel-logo.png"
            alt="BidLevel"
            width={140}
            height={40}
            className="h-8 w-auto"
            priority
          />
        </Link>

        <div className="flex items-center gap-3">
          {/* Credit balance pill - visible when user has credits */}
          {planInfo && planInfo.creditBalance > 0 && !planInfo.isActive && !planInfo.hasApiKey && (
            <Link href="/pricing" className="hidden sm:flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1.5 text-sm font-medium text-accent hover:bg-accent/20 transition-colors">
              <Coins className="h-4 w-4" />
              <span>{planInfo.creditBalance} credits</span>
            </Link>
          )}

          {/* Buy Credits button - visible when low or no credits */}
          {needsCredits && (
            <Link href="/pricing">
              <Button variant="outline" size="sm" className="hidden sm:flex gap-2 border-accent/30 text-accent hover:bg-accent/10 hover:border-accent/50">
                <CreditCard className="h-4 w-4" />
                Buy Credits
              </Button>
            </Link>
          )}

          <Link href="/compare/new">
            <Button className="shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-shadow">
              New Comparison
            </Button>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="flex items-center justify-between gap-2 p-2">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{userEmail}</p>
                </div>
                {getPlanBadge()}
              </div>
              <DropdownMenuSeparator />
              {planInfo && !planInfo.isActive && !planInfo.hasApiKey && (
                <>
                  <DropdownMenuItem asChild>
                    <Link href="/pricing" className="cursor-pointer text-primary">
                      <Coins className="mr-2 h-4 w-4" />
                      Buy Credits
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/pricing" className="cursor-pointer text-primary">
                      <Sparkles className="mr-2 h-4 w-4" />
                      Go Unlimited
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem asChild>
                <Link href="/settings" className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleSignOut}
                className="cursor-pointer text-red-600 focus:text-red-600"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
