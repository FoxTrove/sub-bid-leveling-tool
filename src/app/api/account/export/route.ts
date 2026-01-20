import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get all user data
    const [
      profileResult,
      projectsResult,
      documentsResult,
      creditsResult,
    ] = await Promise.all([
      // Profile data
      supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single(),

      // Projects
      supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id),

      // Documents (via projects)
      supabase
        .from('bid_documents')
        .select('*, projects!inner(user_id)')
        .eq('projects.user_id', user.id),

      // Credit transactions
      supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', user.id),
    ])

    // Get comparison results for user's projects
    let comparisonResults: unknown[] = []
    if (projectsResult.data && projectsResult.data.length > 0) {
      const projectIds = projectsResult.data.map(p => p.id)
      const { data: comparisons } = await supabase
        .from('comparison_results')
        .select('*')
        .in('project_id', projectIds)
      comparisonResults = comparisons || []
    }

    // Sanitize sensitive fields
    const profile = profileResult.data
    if (profile) {
      // Remove encrypted API key from export
      delete profile.openai_api_key_encrypted
    }

    const exportData = {
      exportedAt: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.created_at,
      },
      profile: profile || null,
      projects: projectsResult.data || [],
      documents: (documentsResult.data || []).map(d => ({
        ...d,
        // Remove internal join data
        projects: undefined,
      })),
      comparisonResults,
      creditTransactions: creditsResult.data || [],
    }

    // Return as downloadable JSON
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="bidlevel-data-export-${new Date().toISOString().split('T')[0]}.json"`,
      },
    })
  } catch (error) {
    console.error('Data export error:', error)
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    )
  }
}
