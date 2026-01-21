import { KPIGrid } from "@/components/admin/overview/kpi-grid"
import { RecentSignups } from "@/components/admin/overview/recent-signups"
import { AlertsBanner } from "@/components/admin/overview/alerts-banner"

export default function AdminOverviewPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Admin Overview</h1>
        <p className="text-slate-400 mt-1">
          System-wide metrics and recent activity
        </p>
      </div>

      <AlertsBanner />

      <KPIGrid />

      <div className="grid gap-6 lg:grid-cols-2">
        <RecentSignups />

        <div className="space-y-6">
          {/* Placeholder for future components */}
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-6">
            <h3 className="text-sm font-medium text-slate-400 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <a
                href="/admin/users"
                className="p-4 rounded-lg border border-slate-800 hover:border-slate-700 hover:bg-slate-800/50 transition-colors"
              >
                <p className="text-sm font-medium text-slate-100">User Management</p>
                <p className="text-xs text-slate-500 mt-1">View and manage users</p>
              </a>
              <a
                href="/admin/training"
                className="p-4 rounded-lg border border-slate-800 hover:border-slate-700 hover:bg-slate-800/50 transition-colors"
              >
                <p className="text-sm font-medium text-slate-100">Moderation Queue</p>
                <p className="text-xs text-slate-500 mt-1">Review training data</p>
              </a>
              <a
                href="/admin/analytics/business"
                className="p-4 rounded-lg border border-slate-800 hover:border-slate-700 hover:bg-slate-800/50 transition-colors"
              >
                <p className="text-sm font-medium text-slate-100">Business Metrics</p>
                <p className="text-xs text-slate-500 mt-1">MRR, churn, conversions</p>
              </a>
              <a
                href="/admin/analytics/ai-quality"
                className="p-4 rounded-lg border border-slate-800 hover:border-slate-700 hover:bg-slate-800/50 transition-colors"
              >
                <p className="text-sm font-medium text-slate-100">AI Quality</p>
                <p className="text-xs text-slate-500 mt-1">Pipeline performance</p>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
