"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
  Shield,
  Bell,
  Database,
  RefreshCw,
  ExternalLink,
} from "lucide-react"
import { ADMIN_EMAILS } from "@/lib/admin/constants"

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Admin Settings</h1>
        <p className="text-slate-400 mt-1">
          System configuration and admin access control
        </p>
      </div>

      {/* Access Control */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-slate-800">
              <Shield className="h-5 w-5 text-slate-400" />
            </div>
            <div>
              <CardTitle className="text-lg text-slate-100">Access Control</CardTitle>
              <CardDescription className="text-slate-400">
                Admin email whitelist
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-slate-300">Authorized Admin Emails</Label>
            <div className="space-y-2">
              {ADMIN_EMAILS.map((email) => (
                <div
                  key={email}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50"
                >
                  <span className="text-sm text-slate-100">{email}</span>
                  <Badge variant="outline" className="bg-emerald-900/20 text-emerald-400 border-emerald-800">
                    Active
                  </Badge>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500">
              Admin emails are configured in <code className="bg-slate-800 px-1 py-0.5 rounded">src/lib/admin/constants.ts</code>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Cron Jobs */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-slate-800">
              <RefreshCw className="h-5 w-5 text-slate-400" />
            </div>
            <div>
              <CardTitle className="text-lg text-slate-100">Scheduled Jobs</CardTitle>
              <CardDescription className="text-slate-400">
                Background tasks and cron jobs
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
              <div>
                <p className="text-sm font-medium text-slate-100">Metrics Rollup</p>
                <p className="text-xs text-slate-500">Aggregates daily metrics at midnight UTC</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
                onClick={async () => {
                  try {
                    const res = await fetch("/api/cron/admin-metrics-rollup")
                    if (res.ok) {
                      alert("Metrics rollup completed successfully")
                    } else {
                      alert("Metrics rollup failed")
                    }
                  } catch {
                    alert("Failed to trigger metrics rollup")
                  }
                }}
              >
                Run Now
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
              <div>
                <p className="text-sm font-medium text-slate-100">HANDSHAKE Email Campaigns</p>
                <p className="text-xs text-slate-500">Sends promo reminder emails</p>
              </div>
              <Badge variant="outline" className="bg-slate-800 text-slate-400 border-slate-700">
                Via Vercel Cron
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
              <div>
                <p className="text-sm font-medium text-slate-100">Admin Signup Notifications</p>
                <p className="text-xs text-slate-500">Notifies admins of new signups</p>
              </div>
              <Badge variant="outline" className="bg-slate-800 text-slate-400 border-slate-700">
                Via Vercel Cron
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* External Links */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-slate-800">
              <Database className="h-5 w-5 text-slate-400" />
            </div>
            <div>
              <CardTitle className="text-lg text-slate-100">External Services</CardTitle>
              <CardDescription className="text-slate-400">
                Quick links to external dashboards
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors"
            >
              <span className="text-sm text-slate-100">Supabase Dashboard</span>
              <ExternalLink className="h-4 w-4 text-slate-500" />
            </a>
            <a
              href="https://dashboard.stripe.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors"
            >
              <span className="text-sm text-slate-100">Stripe Dashboard</span>
              <ExternalLink className="h-4 w-4 text-slate-500" />
            </a>
            <a
              href="https://vercel.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors"
            >
              <span className="text-sm text-slate-100">Vercel Dashboard</span>
              <ExternalLink className="h-4 w-4 text-slate-500" />
            </a>
            <a
              href="https://platform.openai.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors"
            >
              <span className="text-sm text-slate-100">OpenAI Platform</span>
              <ExternalLink className="h-4 w-4 text-slate-500" />
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
