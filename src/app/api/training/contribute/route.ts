import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { anonymizeContribution, type ContributionInput } from '@/lib/metrics/anonymizer'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if user has opted in to training contributions
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('training_data_opt_in')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }

  if (!profile.training_data_opt_in) {
    return NextResponse.json({ error: 'User has not opted in to training contributions' }, { status: 403 })
  }

  // Parse the contribution
  const body = await request.json()
  const {
    original_value,
    corrected_value,
    trade_type,
    document_type,
    correction_type,
    raw_text,
    ai_notes,
    confidence_score,
    needs_review,
  } = body as ContributionInput

  // Validate required fields
  if (!original_value || !corrected_value || !trade_type || !document_type || !correction_type) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Validate correction type
  const validCorrectionTypes = ['description', 'category', 'price', 'exclusion_flag', 'quantity', 'unit']
  if (!validCorrectionTypes.includes(correction_type)) {
    return NextResponse.json({ error: 'Invalid correction type' }, { status: 400 })
  }

  // Anonymize the contribution
  const anonymized = anonymizeContribution({
    original_value,
    corrected_value,
    trade_type,
    document_type,
    correction_type,
    raw_text,
    ai_notes,
    confidence_score,
    needs_review,
  })

  // Insert the anonymized contribution (no user_id - completely anonymous)
  const { error: insertError } = await supabase
    .from('training_contributions')
    .insert({
      trade_type: anonymized.trade_type,
      document_type: anonymized.document_type,
      correction_type: anonymized.correction_type,
      original_value: anonymized.original_value,
      corrected_value: anonymized.corrected_value,
      raw_text_snippet: anonymized.raw_text_snippet,
      ai_notes: anonymized.ai_notes,
      confidence_score_original: anonymized.confidence_score_original,
      was_marked_needs_review: anonymized.was_marked_needs_review,
      moderation_status: 'pending',
    })

  if (insertError) {
    console.error('[TrainingContribute] Insert error:', insertError.message)
    return NextResponse.json({ error: 'Failed to save contribution' }, { status: 500 })
  }

  // Increment user's contribution count
  const { error: updateError } = await supabase.rpc('increment_contribution_count', {
    user_id: user.id,
  })

  if (updateError) {
    // Non-critical - log but don't fail the request
    console.error('[TrainingContribute] Failed to increment count:', updateError.message)
  }

  return NextResponse.json({ success: true })
}
