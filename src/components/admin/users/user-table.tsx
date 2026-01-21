"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ExternalLink,
} from "lucide-react"
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
  comparisons_used: number | null
  created_at: string
  last_active_at: string | null
  promo_code: string | null
  project_count: number
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

function getInitials(name: string | null, email: string): string {
  if (name) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }
  return email.substring(0, 2).toUpperCase()
}

function UserRowSkeleton() {
  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-full bg-slate-800" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-32 bg-slate-800" />
            <Skeleton className="h-3 w-40 bg-slate-800" />
          </div>
        </div>
      </TableCell>
      <TableCell><Skeleton className="h-5 w-16 bg-slate-800" /></TableCell>
      <TableCell><Skeleton className="h-4 w-12 bg-slate-800" /></TableCell>
      <TableCell><Skeleton className="h-4 w-8 bg-slate-800" /></TableCell>
      <TableCell><Skeleton className="h-4 w-20 bg-slate-800" /></TableCell>
      <TableCell><Skeleton className="h-8 w-16 bg-slate-800" /></TableCell>
    </TableRow>
  )
}

export function UserTable() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [users, setUsers] = useState<User[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'created_at')
  const [sortOrder, setSortOrder] = useState(searchParams.get('order') || 'desc')

  const page = parseInt(searchParams.get('page') || '1')
  const search = searchParams.get('search') || ''
  const plan = searchParams.get('plan') || ''
  const status = searchParams.get('status') || ''

  useEffect(() => {
    async function fetchUsers() {
      setLoading(true)
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: '20',
          sort: sortBy,
          order: sortOrder,
        })
        if (search) params.set('search', search)
        if (plan) params.set('plan', plan)
        if (status) params.set('status', status)

        const response = await fetch(`/api/admin/users?${params}`)
        if (response.ok) {
          const data = await response.json()
          setUsers(data.users || [])
          setPagination(data.pagination)
        }
      } catch (error) {
        console.error("Failed to fetch users:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchUsers()
  }, [page, search, plan, status, sortBy, sortOrder])

  const handleSort = (column: string) => {
    const newOrder = sortBy === column && sortOrder === 'desc' ? 'asc' : 'desc'
    setSortBy(column)
    setSortOrder(newOrder)

    const params = new URLSearchParams(searchParams.toString())
    params.set('sort', column)
    params.set('order', newOrder)
    router.push(`?${params.toString()}`)
  }

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', newPage.toString())
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-800 bg-slate-900 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-slate-800/50 border-slate-800">
              <TableHead className="text-slate-400">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-slate-400 hover:text-slate-100 -ml-3"
                  onClick={() => handleSort('email')}
                >
                  User
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="text-slate-400">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-slate-400 hover:text-slate-100 -ml-3"
                  onClick={() => handleSort('plan')}
                >
                  Plan
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="text-slate-400">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-slate-400 hover:text-slate-100 -ml-3"
                  onClick={() => handleSort('credit_balance')}
                >
                  Credits
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="text-slate-400">Projects</TableHead>
              <TableHead className="text-slate-400">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-slate-400 hover:text-slate-100 -ml-3"
                  onClick={() => handleSort('created_at')}
                >
                  Joined
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="text-slate-400 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 10 }).map((_, i) => <UserRowSkeleton key={i} />)
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow
                  key={user.id}
                  className="hover:bg-slate-800/50 border-slate-800 cursor-pointer"
                  onClick={() => router.push(`/admin/users/${user.id}`)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8 bg-slate-800 border border-slate-700">
                        <AvatarFallback className="bg-slate-800 text-slate-300 text-xs">
                          {getInitials(user.full_name, user.email)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-slate-100">
                          {user.full_name || user.email.split('@')[0]}
                        </p>
                        <p className="text-xs text-slate-500">{user.email}</p>
                      </div>
                      {user.promo_code && (
                        <Badge variant="outline" className="text-xs bg-amber-900/30 text-amber-400 border-amber-800">
                          {user.promo_code}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs",
                        user.subscription_status === 'active'
                          ? "bg-emerald-900/30 text-emerald-400 border-emerald-800"
                          : "bg-slate-800 text-slate-400 border-slate-700"
                      )}
                    >
                      {user.plan || 'free'}
                    </Badge>
                    {user.subscription_status === 'active' && (
                      <span className="text-[10px] text-emerald-500 ml-1">●</span>
                    )}
                  </TableCell>
                  <TableCell className="text-slate-300">
                    {user.credit_balance || 0}
                  </TableCell>
                  <TableCell className="text-slate-300">
                    {user.project_count}
                  </TableCell>
                  <TableCell className="text-slate-400 text-sm">
                    {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-slate-400 hover:text-slate-100"
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/admin/users/${user.id}`)
                      }}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-400">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} users
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-slate-400">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
