// Admin email whitelist - centralized for reuse
export const ADMIN_EMAILS = [
  'kyle@foxtrove.ai',
  'admin@bidvet.com',
]

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return ADMIN_EMAILS.includes(email)
}
