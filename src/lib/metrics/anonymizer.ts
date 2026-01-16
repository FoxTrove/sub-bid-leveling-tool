/**
 * Anonymization service for training data contributions.
 *
 * Strips sensitive information while preserving the semantic content
 * needed for AI training improvements.
 */

// Patterns to detect and redact sensitive information
const SENSITIVE_PATTERNS = {
  // Company/contractor names (common patterns)
  companyNames: /\b([A-Z][a-z]+\s)+(Inc|LLC|Corp|Co|Ltd|Company|Construction|Electric|Electrical|Plumbing|Mechanical|Contractors?|Services?|Solutions?|Industries?|Enterprises?|Group|Associates?|Partners?)\b/gi,

  // Dollar amounts (exact figures might identify projects)
  dollarAmounts: /\$[\d,]+(\.\d{2})?/g,

  // Phone numbers
  phoneNumbers: /(\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g,

  // Email addresses
  emails: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,

  // Addresses (street numbers and names)
  addresses: /\d+\s+[A-Za-z]+\s+(St|Street|Ave|Avenue|Blvd|Boulevard|Rd|Road|Dr|Drive|Lane|Ln|Way|Court|Ct|Place|Pl|Circle|Cir|Pkwy|Parkway)\b\.?/gi,

  // Project names/identifiers
  projectIds: /\b(Project|Job|PO|RFQ|Bid|Quote|Proposal|Estimate|Contract)\s*[#:]?\s*[\w-]+\d+[\w-]*/gi,

  // Specific dates that might identify bids
  specificDates: /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/gi,

  // Date formats
  numericDates: /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/g,

  // Names that look like person names (capitalized words not at sentence start)
  personNames: /(?<=[a-z]\s)([A-Z][a-z]+\s){1,2}[A-Z][a-z]+(?=\s|$|,|\.)/g,
}

/**
 * Anonymize text by replacing sensitive patterns with placeholders
 */
export function anonymizeText(text: string): string {
  if (!text) return text

  let anonymized = text

  // Replace company names with generic placeholder
  anonymized = anonymized.replace(SENSITIVE_PATTERNS.companyNames, '[CONTRACTOR]')

  // Normalize dollar amounts to ranges
  anonymized = anonymized.replace(SENSITIVE_PATTERNS.dollarAmounts, (match) => {
    const amount = parseFloat(match.replace(/[$,]/g, ''))
    return `$[${getPriceRange(amount)}]`
  })

  // Remove contact info
  anonymized = anonymized.replace(SENSITIVE_PATTERNS.phoneNumbers, '[PHONE]')
  anonymized = anonymized.replace(SENSITIVE_PATTERNS.emails, '[EMAIL]')
  anonymized = anonymized.replace(SENSITIVE_PATTERNS.addresses, '[ADDRESS]')

  // Remove project identifiers
  anonymized = anonymized.replace(SENSITIVE_PATTERNS.projectIds, '[PROJECT_ID]')

  // Normalize dates
  anonymized = anonymized.replace(SENSITIVE_PATTERNS.specificDates, '[DATE]')
  anonymized = anonymized.replace(SENSITIVE_PATTERNS.numericDates, '[DATE]')

  // Clean up person names (conservative - only clear patterns)
  anonymized = anonymized.replace(SENSITIVE_PATTERNS.personNames, '[NAME]')

  return anonymized
}

/**
 * Convert a price to a range bucket for anonymization
 */
function getPriceRange(price: number): string {
  if (price < 500) return '<500'
  if (price < 1000) return '500-1K'
  if (price < 5000) return '1K-5K'
  if (price < 10000) return '5K-10K'
  if (price < 25000) return '10K-25K'
  if (price < 50000) return '25K-50K'
  if (price < 100000) return '50K-100K'
  if (price < 250000) return '100K-250K'
  if (price < 500000) return '250K-500K'
  if (price < 1000000) return '500K-1M'
  return '>1M'
}

/**
 * Anonymize a price value to a range bucket string
 */
export function anonymizePriceValue(price: number | null): string | null {
  if (price === null || price === undefined) return null
  return getPriceRange(price)
}

export type CorrectionType =
  | 'description'
  | 'category'
  | 'price'
  | 'exclusion_flag'
  | 'quantity'
  | 'unit'

export interface ContributionInput {
  original_value: Record<string, unknown>
  corrected_value: Record<string, unknown>
  trade_type: string
  document_type: string
  correction_type: CorrectionType
  raw_text?: string
  ai_notes?: string
  confidence_score?: number
  needs_review?: boolean
}

export interface AnonymizedContribution {
  trade_type: string
  document_type: string
  correction_type: CorrectionType
  original_value: Record<string, unknown>
  corrected_value: Record<string, unknown>
  raw_text_snippet: string | null
  ai_notes: string | null
  confidence_score_original: number | null
  was_marked_needs_review: boolean | null
}

/**
 * Anonymize a full contribution for storage
 */
export function anonymizeContribution(input: ContributionInput): AnonymizedContribution {
  const {
    original_value,
    corrected_value,
    trade_type,
    document_type,
    correction_type,
    raw_text,
    ai_notes,
    confidence_score,
    needs_review
  } = input

  // Deep clone and anonymize values based on correction type
  const anonymizedOriginal = anonymizeValue({ ...original_value }, correction_type)
  const anonymizedCorrected = anonymizeValue({ ...corrected_value }, correction_type)

  return {
    trade_type,
    document_type,
    correction_type,
    original_value: anonymizedOriginal,
    corrected_value: anonymizedCorrected,
    raw_text_snippet: raw_text ? anonymizeText(raw_text.slice(0, 500)) : null,
    ai_notes: ai_notes ? anonymizeText(ai_notes) : null,
    confidence_score_original: confidence_score ?? null,
    was_marked_needs_review: needs_review ?? null,
  }
}

/**
 * Anonymize a value object based on correction type
 */
function anonymizeValue(
  value: Record<string, unknown>,
  type: CorrectionType
): Record<string, unknown> {
  const result = { ...value }

  switch (type) {
    case 'description':
      // Anonymize text content
      if (typeof result.text === 'string') {
        result.text = anonymizeText(result.text)
      }
      if (typeof result.description === 'string') {
        result.description = anonymizeText(result.description)
      }
      break

    case 'price':
      // Convert prices to ranges
      if (typeof result.total_price === 'number') {
        result.total_price_range = anonymizePriceValue(result.total_price as number)
        delete result.total_price
      }
      if (typeof result.unit_price === 'number') {
        result.unit_price_range = anonymizePriceValue(result.unit_price as number)
        delete result.unit_price
      }
      break

    case 'category':
    case 'exclusion_flag':
    case 'unit':
      // These are typically not sensitive, keep as-is
      // But anonymize any text fields that might exist
      Object.keys(result).forEach(key => {
        if (typeof result[key] === 'string' && key !== 'value' && key !== 'category' && key !== 'unit') {
          result[key] = anonymizeText(result[key] as string)
        }
      })
      break

    case 'quantity':
      // Quantities themselves aren't sensitive, but any notes might be
      if (typeof result.notes === 'string') {
        result.notes = anonymizeText(result.notes)
      }
      break
  }

  return result
}

/**
 * Detect what corrections were made between original and corrected values
 */
export function detectCorrections(
  original: Record<string, unknown>,
  corrected: Record<string, unknown>
): { type: CorrectionType; original: Record<string, unknown>; corrected: Record<string, unknown> }[] {
  const corrections: { type: CorrectionType; original: Record<string, unknown>; corrected: Record<string, unknown> }[] = []

  // Check description
  if (corrected.description !== undefined && corrected.description !== original.description) {
    corrections.push({
      type: 'description',
      original: { text: original.description, confidence: original.confidence_score },
      corrected: { text: corrected.description },
    })
  }

  // Check category
  if (corrected.category !== undefined && corrected.category !== original.category) {
    corrections.push({
      type: 'category',
      original: { value: original.category, confidence: original.confidence_score },
      corrected: { value: corrected.category },
    })
  }

  // Check prices
  if (
    (corrected.total_price !== undefined && corrected.total_price !== original.total_price) ||
    (corrected.unit_price !== undefined && corrected.unit_price !== original.unit_price)
  ) {
    corrections.push({
      type: 'price',
      original: {
        total_price: original.total_price,
        unit_price: original.unit_price,
        confidence: original.confidence_score
      },
      corrected: {
        total_price: corrected.total_price ?? original.total_price,
        unit_price: corrected.unit_price ?? original.unit_price
      },
    })
  }

  // Check exclusion flag
  if (corrected.is_exclusion !== undefined && corrected.is_exclusion !== original.is_exclusion) {
    corrections.push({
      type: 'exclusion_flag',
      original: { value: original.is_exclusion, confidence: original.confidence_score },
      corrected: { value: corrected.is_exclusion },
    })
  }

  // Check quantity
  if (corrected.quantity !== undefined && corrected.quantity !== original.quantity) {
    corrections.push({
      type: 'quantity',
      original: { value: original.quantity, confidence: original.confidence_score },
      corrected: { value: corrected.quantity },
    })
  }

  // Check unit
  if (corrected.unit !== undefined && corrected.unit !== original.unit) {
    corrections.push({
      type: 'unit',
      original: { value: original.unit, confidence: original.confidence_score },
      corrected: { value: corrected.unit },
    })
  }

  return corrections
}
