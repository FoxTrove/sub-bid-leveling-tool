import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import {
  exportTrainingDataAsJSONL,
  exportTrainingDataAsJSON,
  getPromptImprovementExamples,
} from '@/lib/analytics/export'

// Admin email whitelist
const ADMIN_EMAILS = [
  'kyle@foxtrove.ai',
  'admin@bidvet.com',
]

async function isAdmin(supabase: Awaited<ReturnType<typeof createClient>>): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return false
  return ADMIN_EMAILS.includes(user.email)
}

/**
 * GET /api/admin/export
 * Export training data in various formats
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient()

  if (!(await isAdmin(supabase))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const searchParams = request.nextUrl.searchParams
  const format = searchParams.get('format') || 'json'
  const tradeType = searchParams.get('trade_type')
  const correctionType = searchParams.get('correction_type')
  const limit = parseInt(searchParams.get('limit') || '1000')

  const tradeTypes = tradeType ? tradeType.split(',') : undefined
  const correctionTypes = correctionType ? correctionType.split(',') : undefined

  try {
    switch (format) {
      case 'jsonl': {
        const { jsonl, stats } = await exportTrainingDataAsJSONL(supabase, {
          tradeTypes,
          correctionTypes,
          limit,
        })

        // Return as downloadable file
        return new NextResponse(jsonl, {
          headers: {
            'Content-Type': 'application/jsonl',
            'Content-Disposition': `attachment; filename="training_data_${new Date().toISOString().split('T')[0]}.jsonl"`,
            'X-Export-Stats': JSON.stringify(stats),
          },
        })
      }

      case 'json': {
        const data = await exportTrainingDataAsJSON(supabase, {
          tradeTypes,
          limit,
        })
        return NextResponse.json({ data, count: data.length })
      }

      case 'prompt-examples': {
        if (!tradeType || !correctionType) {
          return NextResponse.json(
            { error: 'trade_type and correction_type required for prompt-examples' },
            { status: 400 }
          )
        }
        const examples = await getPromptImprovementExamples(
          supabase,
          tradeType,
          correctionType,
          limit
        )
        return NextResponse.json({ examples, count: examples.length })
      }

      default:
        return NextResponse.json({ error: 'Invalid format. Use: json, jsonl, or prompt-examples' }, { status: 400 })
    }
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ error: 'Failed to export data' }, { status: 500 })
  }
}
