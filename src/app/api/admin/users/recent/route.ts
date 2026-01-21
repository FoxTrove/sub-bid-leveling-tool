import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { isAdminEmail } from '@/lib/admin/constants'

/**
 * GET /api/admin/users/recent
 * Get recent user signups with profile info
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user?.email || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const searchParams = request.nextUrl.searchParams
  const limit = parseInt(searchParams.get('limit') || '10')

  const adminClient = createAdminClient()

  try {
    const { data: users, error } = await adminClient
      .from('profiles')
      .select(`
        id,
        email,
        full_name,
        company_name,
        plan,
        subscription_status,
        credit_balance,
        created_at,
        promo_code
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    return NextResponse.json({ users })
  } catch (error) {
    console.error('Recent users error:', error)
    return NextResponse.json({ error: 'Failed to fetch recent users' }, { status: 500 })
  }
}
