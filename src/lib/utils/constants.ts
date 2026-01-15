// Trial period duration in days
export const TRIAL_DURATION_DAYS = 30

// Maximum file size for uploads (25MB)
export const MAX_FILE_SIZE = 25 * 1024 * 1024

// Allowed file types for bid documents
export const ALLOWED_FILE_TYPES = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'application/vnd.ms-excel': ['.xls'],
  'text/csv': ['.csv'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/msword': ['.doc'],
} as const

// Min/max bids per comparison
export const MIN_BIDS = 2
export const MAX_BIDS = 5

// OpenAI model to use
export const OPENAI_MODEL = 'gpt-4o'

// Confidence thresholds
export const CONFIDENCE_THRESHOLD_LOW = 0.6
export const CONFIDENCE_THRESHOLD_MEDIUM = 0.8
