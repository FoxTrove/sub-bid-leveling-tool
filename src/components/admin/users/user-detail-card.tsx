"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import {
  Mail,
  Building2,
  Calendar,
  CreditCard,
  Activity,
  FolderKanban,
  FileText,
  CheckCircle2,
} from "lucide-react"

interface UserDetailCardProps {
  user: {
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
    stripe_customer_id: string | null
    trial_started_at: string
  }
  stats: {
    projectCount: number
    completedComparisons: number
    documentCount: number
  }
  organization?: {
    id: string
    name: string
    slug: string
    plan: string
    max_members: number
  } | null
}

function getInitials(name: string | null, email: string): string {
  if (name) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }
  return email.substring(0, 2).toUpperCase()
}

export function UserDetailCard({ user, stats, organization }: UserDetailCardProps) {
  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16 bg-slate-800 border-2 border-slate-700">
            <AvatarFallback className="bg-slate-800 text-slate-300 text-xl">
              {getInitials(user.full_name, user.email)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-xl text-slate-100">
                {user.full_name || user.email.split('@')[0]}
              </CardTitle>
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
                <Badge variant="outline" className="text-xs bg-emerald-900/20 text-emerald-400 border-emerald-800">
                  Active
                </Badge>
              )}
              {user.promo_code && (
                <Badge variant="outline" className="text-xs bg-amber-900/30 text-amber-400 border-amber-800">
                  {user.promo_code}
                </Badge>
              )}
            </div>
            <CardDescription className="mt-1 text-slate-400">
              {user.email}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* User Info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-slate-500" />
            <span className="text-slate-400">Email:</span>
            <span className="text-slate-200 truncate">{user.email}</span>
          </div>
          {user.company_name && (
            <div className="flex items-center gap-2 text-sm">
              <Building2 className="h-4 w-4 text-slate-500" />
              <span className="text-slate-400">Company:</span>
              <span className="text-slate-200">{user.company_name}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-slate-500" />
            <span className="text-slate-400">Joined:</span>
            <span className="text-slate-200">
              {format(new Date(user.created_at), 'MMM d, yyyy')}
            </span>
          </div>
          {user.last_active_at && (
            <div className="flex items-center gap-2 text-sm">
              <Activity className="h-4 w-4 text-slate-500" />
              <span className="text-slate-400">Last active:</span>
              <span className="text-slate-200">
                {format(new Date(user.last_active_at), 'MMM d, yyyy')}
              </span>
            </div>
          )}
        </div>

        <Separator className="bg-slate-800" />

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="p-3 rounded-lg bg-slate-800/50 text-center">
            <CreditCard className="h-5 w-5 mx-auto text-slate-500 mb-1" />
            <p className="text-2xl font-bold text-slate-100">{user.credit_balance || 0}</p>
            <p className="text-xs text-slate-500">Credits</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-800/50 text-center">
            <FolderKanban className="h-5 w-5 mx-auto text-slate-500 mb-1" />
            <p className="text-2xl font-bold text-slate-100">{stats.projectCount}</p>
            <p className="text-xs text-slate-500">Projects</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-800/50 text-center">
            <CheckCircle2 className="h-5 w-5 mx-auto text-slate-500 mb-1" />
            <p className="text-2xl font-bold text-slate-100">{stats.completedComparisons}</p>
            <p className="text-xs text-slate-500">Completed</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-800/50 text-center">
            <FileText className="h-5 w-5 mx-auto text-slate-500 mb-1" />
            <p className="text-2xl font-bold text-slate-100">{stats.documentCount}</p>
            <p className="text-xs text-slate-500">Documents</p>
          </div>
        </div>

        {/* Organization */}
        {organization && (
          <>
            <Separator className="bg-slate-800" />
            <div>
              <p className="text-sm font-medium text-slate-400 mb-2">Organization</p>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50">
                <Building2 className="h-8 w-8 text-slate-500" />
                <div>
                  <p className="text-sm font-medium text-slate-100">{organization.name}</p>
                  <p className="text-xs text-slate-500">
                    {organization.plan} plan · {organization.max_members} max members
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Stripe Info */}
        {user.stripe_customer_id && (
          <>
            <Separator className="bg-slate-800" />
            <div className="text-sm">
              <span className="text-slate-400">Stripe Customer:</span>
              <a
                href={`https://dashboard.stripe.com/customers/${user.stripe_customer_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 text-blue-400 hover:underline"
              >
                {user.stripe_customer_id}
              </a>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
