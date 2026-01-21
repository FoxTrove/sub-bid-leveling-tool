import { SupabaseClient } from "@supabase/supabase-js"

/**
 * Updates the user's last_active_at timestamp.
 * Called from server components/API routes to track user activity.
 * Throttled to only update if more than 5 minutes since last update.
 */
export async function updateLastActive(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  try {
    // Use an upsert-like update that only updates if
    // last_active_at is null or more than 5 minutes old
    await supabase.rpc("update_last_active_throttled", { user_id: userId })
  } catch (error) {
    // Silently fail - this is a non-critical operation
    console.error("Failed to update last_active_at:", error)
  }
}
