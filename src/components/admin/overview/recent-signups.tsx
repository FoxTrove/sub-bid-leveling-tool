"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"

interface User {
  id: string
  email: string
  full_name: string | null
  company_name: string | null
  plan: string | null
  subscription_status: string | null
  credit_balance: number | null
  created_at: string
  promo_code: string | null
}

function getInitials(name: string | null, email: string): string {
  if (name) {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }
  return email.substring(0, 2).toUpperCase()
}

function getPlanBadgeVariant(plan: string | null, status: string | null): "default" | "secondary" | "outline" {
  if (status === 'active') {
    if (plan === 'team' || plan === 'enterprise') return 'default'
    if (plan === 'pro') return 'secondary'
  }
  return 'outline'
}

export function RecentSignups() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchUsers() {
      try {
        const response = await fetch("/api/admin/users/recent?limit=10")
        if (response.ok) {
          const data = await response.json()
          setUsers(data.users || [])
        }
      } catch (error) {
        console.error("Failed to fetch recent users:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchUsers()
  }, [])

  if (loading) {
    return (
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-slate-100">Recent Signups</CardTitle>
          <CardDescription className="text-slate-400">
            Latest user registrations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full bg-slate-800" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32 bg-slate-800" />
                  <Skeleton className="h-3 w-48 bg-slate-800" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-slate-100">Recent Signups</CardTitle>
        <CardDescription className="text-slate-400">
          Latest user registrations
        </CardDescription>
      </CardHeader>
      <CardContent>
        {users.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">
            No users found
          </p>
        ) : (
          <div className="space-y-4">
            {users.map((user) => (
              <Link
                key={user.id}
                href={`/admin/users/${user.id}`}
                className="flex items-center gap-4 p-2 -mx-2 rounded-lg hover:bg-slate-800/50 transition-colors"
              >
                <Avatar className="h-10 w-10 bg-slate-800 border border-slate-700">
                  <AvatarFallback className="bg-slate-800 text-slate-300 text-sm">
                    {getInitials(user.full_name, user.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-slate-100 truncate">
                      {user.full_name || user.email.split('@')[0]}
                    </p>
                    <Badge
                      variant={getPlanBadgeVariant(user.plan, user.subscription_status)}
                      className={cn(
                        "text-xs",
                        user.subscription_status === 'active'
                          ? "bg-emerald-900/50 text-emerald-400 border-emerald-800"
                          : "bg-slate-800 text-slate-400 border-slate-700"
                      )}
                    >
                      {user.plan || 'free'}
                    </Badge>
                    {user.promo_code && (
                      <Badge variant="outline" className="text-xs bg-amber-900/50 text-amber-400 border-amber-800">
                        {user.promo_code}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-slate-500 truncate">
                      {user.email}
                    </p>
                    <span className="text-slate-700">•</span>
                    <p className="text-xs text-slate-500">
                      {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
