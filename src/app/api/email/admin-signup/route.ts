import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendAdminNewSignupEmail } from '@/lib/email'

export async function POST() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email, full_name, company_name, promo_code, training_data_opt_in, admin_signup_notified_at')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Don't send if already notified
    if (profile.admin_signup_notified_at) {
      return NextResponse.json({ message: 'Admin already notified' }, { status: 200 })
    }

    // Send admin notification email
    const result = await sendAdminNewSignupEmail({
      userName: profile.full_name || 'Unknown',
      userEmail: profile.email,
      companyName: profile.company_name || 'Unknown',
      promoCode: profile.promo_code,
      trainingDataOptIn: profile.training_data_opt_in || false,
    })

    if (!result.success) {
      console.error('Failed to send admin signup notification:', result.error)
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
    }

    // Mark as notified
    await supabase
      .from('profiles')
      .update({ admin_signup_notified_at: new Date().toISOString() })
      .eq('id', user.id)

    return NextResponse.json({ success: true, id: result.id })
  } catch (error) {
    console.error('Admin signup notification error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
