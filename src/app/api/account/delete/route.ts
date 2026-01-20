import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe/client'
import { NextResponse } from 'next/server'

export async function DELETE() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const adminClient = createAdminClient()

  try {
    // 1. Get user profile to check for Stripe subscription
    const { data: profile } = await adminClient
      .from('profiles')
      .select('stripe_customer_id, stripe_subscription_id')
      .eq('id', user.id)
      .single()

    // 2. Cancel Stripe subscription if exists
    if (profile?.stripe_subscription_id) {
      try {
        await stripe.subscriptions.cancel(profile.stripe_subscription_id)
        console.log(`Canceled subscription ${profile.stripe_subscription_id} for user ${user.id}`)
      } catch (stripeError) {
        console.error('Failed to cancel Stripe subscription:', stripeError)
        // Continue with deletion even if Stripe fails
      }
    }

    // 3. Delete storage files (bid documents)
    // First get all projects to find their documents
    const { data: projects } = await adminClient
      .from('projects')
      .select('id')
      .eq('user_id', user.id)

    if (projects && projects.length > 0) {
      const projectIds = projects.map(p => p.id)

      // Get all documents for these projects
      const { data: documents } = await adminClient
        .from('bid_documents')
        .select('file_url')
        .in('project_id', projectIds)

      // Delete files from storage
      if (documents && documents.length > 0) {
        const filePaths = documents
          .map(d => {
            // Extract path from URL - format: .../storage/v1/object/public/bid-documents/path
            const match = d.file_url.match(/bid-documents\/(.+)$/)
            return match ? match[1] : null
          })
          .filter(Boolean) as string[]

        if (filePaths.length > 0) {
          const { error: storageError } = await adminClient.storage
            .from('bid-documents')
            .remove(filePaths)

          if (storageError) {
            console.error('Failed to delete storage files:', storageError)
            // Continue with deletion even if storage fails
          }
        }
      }
    }

    // 4. Delete user from Supabase auth (cascades to all tables via ON DELETE CASCADE)
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id)

    if (deleteError) {
      console.error('Failed to delete user:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete account' },
        { status: 500 }
      )
    }

    console.log(`Account deleted for user ${user.id}`)

    return NextResponse.json({
      success: true,
      message: 'Account successfully deleted'
    })
  } catch (error) {
    console.error('Account deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    )
  }
}
