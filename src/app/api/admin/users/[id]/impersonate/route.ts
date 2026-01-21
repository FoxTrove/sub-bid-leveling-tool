import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { isAdminEmail } from '@/lib/admin/constants'

/**
 * POST /api/admin/users/[id]/impersonate
 * Generate an impersonation link for a user
 *
 * Note: This creates a magic link that the admin can use to log in as the target user.
 * The session will be clearly marked as an impersonation session.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user?.email || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { id } = await params
  const adminClient = createAdminClient()

  try {
    // Get the target user's email
    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('email, full_name')
      .eq('id', id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Generate a magic link for the target user
    // Note: Supabase Admin API can generate sign-in links
    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: 'magiclink',
      email: profile.email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?impersonated_by=${encodeURIComponent(user.email)}`,
      },
    })

    if (linkError || !linkData?.properties?.action_link) {
      console.error('Failed to generate impersonation link:', linkError)
      return NextResponse.json(
        { error: 'Failed to generate impersonation link' },
        { status: 500 }
      )
    }

    // Log the impersonation for audit purposes
    console.log(`[IMPERSONATION] Admin ${user.email} impersonating user ${profile.email} (${id})`)

    return NextResponse.json({
      success: true,
      message: `Impersonation link generated for ${profile.email}`,
      link: linkData.properties.action_link,
      targetUser: {
        id,
        email: profile.email,
        name: profile.full_name,
      },
    })
  } catch (error) {
    console.error('Impersonation error:', error)
    return NextResponse.json({ error: 'Failed to create impersonation session' }, { status: 500 })
  }
}
