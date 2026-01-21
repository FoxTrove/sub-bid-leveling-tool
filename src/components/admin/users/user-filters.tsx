"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, X } from "lucide-react"

export function UserFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('search') || '')

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (search) {
        params.set('search', search)
      } else {
        params.delete('search')
      }
      params.set('page', '1') // Reset to page 1 on search
      router.push(`?${params.toString()}`)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [search])

  const handlePlanChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== 'all') {
      params.set('plan', value)
    } else {
      params.delete('plan')
    }
    params.set('page', '1')
    router.push(`?${params.toString()}`)
  }

  const handleStatusChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== 'all') {
      params.set('status', value)
    } else {
      params.delete('status')
    }
    params.set('page', '1')
    router.push(`?${params.toString()}`)
  }

  const clearFilters = () => {
    setSearch('')
    router.push('/admin/users')
  }

  const hasFilters = search || searchParams.get('plan') || searchParams.get('status')

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
        <Input
          placeholder="Search by email, name, or company..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-500"
        />
      </div>

      <Select
        value={searchParams.get('plan') || 'all'}
        onValueChange={handlePlanChange}
      >
        <SelectTrigger className="w-[150px] bg-slate-900 border-slate-700 text-slate-100">
          <SelectValue placeholder="Plan" />
        </SelectTrigger>
        <SelectContent className="bg-slate-900 border-slate-700">
          <SelectItem value="all" className="text-slate-100">All Plans</SelectItem>
          <SelectItem value="free" className="text-slate-100">Free</SelectItem>
          <SelectItem value="pro" className="text-slate-100">Pro</SelectItem>
          <SelectItem value="team" className="text-slate-100">Team</SelectItem>
          <SelectItem value="enterprise" className="text-slate-100">Enterprise</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={searchParams.get('status') || 'all'}
        onValueChange={handleStatusChange}
      >
        <SelectTrigger className="w-[150px] bg-slate-900 border-slate-700 text-slate-100">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent className="bg-slate-900 border-slate-700">
          <SelectItem value="all" className="text-slate-100">All Status</SelectItem>
          <SelectItem value="active" className="text-slate-100">Active</SelectItem>
          <SelectItem value="inactive" className="text-slate-100">Inactive</SelectItem>
          <SelectItem value="trialing" className="text-slate-100">Trialing</SelectItem>
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button
          variant="outline"
          size="icon"
          onClick={clearFilters}
          className="border-slate-700 text-slate-400 hover:text-slate-100 hover:bg-slate-800"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
