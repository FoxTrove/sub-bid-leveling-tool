import { Suspense } from "react"
import { UserTable } from "@/components/admin/users/user-table"
import { UserFilters } from "@/components/admin/users/user-filters"
import { Skeleton } from "@/components/ui/skeleton"

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 10 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full bg-slate-800" />
      ))}
    </div>
  )
}

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">User Management</h1>
        <p className="text-slate-400 mt-1">
          View and manage all registered users
        </p>
      </div>

      <Suspense fallback={<Skeleton className="h-10 w-full bg-slate-800" />}>
        <UserFilters />
      </Suspense>

      <Suspense fallback={<TableSkeleton />}>
        <UserTable />
      </Suspense>
    </div>
  )
}
