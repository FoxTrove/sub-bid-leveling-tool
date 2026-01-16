import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('training_data_opt_in, training_data_opted_in_at, training_data_contribution_count')
    .eq('id', user.id)
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }

  return NextResponse.json({
    opt_in: profile.training_data_opt_in ?? false,
    opted_in_at: profile.training_data_opted_in_at,
    contribution_count: profile.training_data_contribution_count ?? 0,
  })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { opt_in } = body

  if (typeof opt_in !== 'boolean') {
    return NextResponse.json({ error: 'Invalid opt_in value' }, { status: 400 })
  }

  const updateData: Record<string, unknown> = {
    training_data_opt_in: opt_in,
  }

  // Set opted_in_at timestamp when opting in
  if (opt_in) {
    updateData.training_data_opted_in_at = new Date().toISOString()
  }

  const { error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', user.id)

  if (error) {
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }

  return NextResponse.json({ success: true, opt_in })
}
