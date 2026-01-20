import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendHandshakeWelcomeEmail } from '@/lib/email'

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
      .select('email, full_name, promo_code, handshake_welcome_sent_at')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Only send for HANDSHAKE users
    if (profile.promo_code !== 'HANDSHAKE') {
      return NextResponse.json({ message: 'Not a HANDSHAKE user' }, { status: 200 })
    }

    // Don't send if already sent
    if (profile.handshake_welcome_sent_at) {
      return NextResponse.json({ message: 'Welcome email already sent' }, { status: 200 })
    }

    // Send welcome email
    const firstName = profile.full_name?.split(' ')[0] || 'there'
    const result = await sendHandshakeWelcomeEmail({
      to: profile.email,
      firstName,
    })

    if (!result.success) {
      console.error('Failed to send welcome email:', result.error)
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
    }

    // Mark as sent
    await supabase
      .from('profiles')
      .update({ handshake_welcome_sent_at: new Date().toISOString() })
      .eq('id', user.id)

    return NextResponse.json({ success: true, id: result.id })
  } catch (error) {
    console.error('Welcome email error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
