import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AdminDashboard } from "@/components/admin/admin-dashboard"

// Admin email whitelist
const ADMIN_EMAILS = [
  'kyle@foxtrove.ai',
  'admin@bidlevel.com',
]

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  if (!user.email || !ADMIN_EMAILS.includes(user.email)) {
    redirect("/dashboard")
  }

  return <AdminDashboard />
}
