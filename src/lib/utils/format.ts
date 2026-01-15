import { TRIAL_DURATION_DAYS } from './constants'

export function formatCurrency(amount: number | null | undefined): string {
  if (amount == null) return '-'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatCurrencyDetailed(amount: number | null | undefined): string {
  if (amount == null) return '-'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatNumber(num: number | null | undefined): string {
  if (num == null) return '-'
  return new Intl.NumberFormat('en-US').format(num)
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '-'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(dateString))
}

export function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) return '-'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(dateString))
}

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInMs = now.getTime() - date.getTime()
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

  if (diffInDays === 0) return 'Today'
  if (diffInDays === 1) return 'Yesterday'
  if (diffInDays < 7) return `${diffInDays} days ago`
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`
  return formatDate(dateString)
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function formatConfidence(score: number): string {
  return `${Math.round(score * 100)}%`
}

export function getTrialDaysRemaining(trialStartedAt: string): number {
  const startDate = new Date(trialStartedAt)
  const endDate = new Date(startDate)
  endDate.setDate(endDate.getDate() + TRIAL_DURATION_DAYS)

  const now = new Date()
  const diffInMs = endDate.getTime() - now.getTime()
  const diffInDays = Math.ceil(diffInMs / (1000 * 60 * 60 * 24))

  return Math.max(0, diffInDays)
}

export function isTrialExpired(trialStartedAt: string): boolean {
  return getTrialDaysRemaining(trialStartedAt) === 0
}
