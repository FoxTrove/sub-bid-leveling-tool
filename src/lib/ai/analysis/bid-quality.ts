/**
 * Bid Quality Analysis Module
 *
 * Analyzes subcontractor bids for quality indicators:
 * - Completeness scoring (0-100)
 * - Red flag detection
 * - Risk level assessment
 */

import type {
  ExtractedItem,
  BidQualityAnalysis,
  BidQualityFactors,
  RedFlag,
  RedFlagType,
  RedFlagSeverity,
} from '@/types'

// ============================================
// CONSTANTS
// ============================================

const PRICE_OUTLIER_LOW_THRESHOLD = 0.85 // Below 85% of average
const PRICE_OUTLIER_HIGH_THRESHOLD = 1.15 // Above 115% of average
const LUMP_SUM_THRESHOLD = 0.5 // >50% lump sums is concerning
const ALLOWANCE_THRESHOLD = 0.1 // >10% allowances is concerning
const LOW_CONFIDENCE_THRESHOLD = 0.7
const VAGUE_DESCRIPTION_MIN_LENGTH = 10

// Trade-specific expected items
const EXPECTED_ITEMS_BY_TRADE: Record<string, string[]> = {
  Electrical: [
    'rough-in',
    'panel',
    'service',
    'fixture',
    'lighting',
    'outlet',
    'switch',
    'conduit',
    'wire',
    'permit',
    'fire alarm',
  ],
  Plumbing: [
    'rough-in',
    'fixture',
    'pipe',
    'water heater',
    'drain',
    'vent',
    'permit',
    'toilet',
    'sink',
    'faucet',
  ],
  HVAC: [
    'equipment',
    'ductwork',
    'controls',
    'thermostat',
    'insulation',
    'balancing',
    'commissioning',
    'permit',
  ],
  'Fire Protection': [
    'sprinkler',
    'pipe',
    'head',
    'pump',
    'standpipe',
    'permit',
    'testing',
  ],
  Roofing: [
    'tear-off',
    'membrane',
    'insulation',
    'flashing',
    'drainage',
    'warranty',
  ],
  Concrete: [
    'forming',
    'rebar',
    'placement',
    'finishing',
    'curing',
    'pumping',
  ],
  Masonry: ['block', 'brick', 'mortar', 'scaffolding', 'flashing'],
  'Steel/Structural': [
    'fabrication',
    'erection',
    'connection',
    'fireproofing',
  ],
  'Drywall/Framing': [
    'framing',
    'stud',
    'drywall',
    'taping',
    'finishing',
    'insulation',
  ],
  Painting: ['prep', 'primer', 'paint', 'wall', 'trim', 'door'],
  Flooring: ['prep', 'tile', 'carpet', 'vct', 'lvt', 'base'],
  'Millwork/Casework': ['cabinet', 'countertop', 'trim', 'hardware'],
  'Glass/Glazing': ['storefront', 'window', 'door', 'curtain wall', 'sealant'],
  Landscaping: ['grading', 'irrigation', 'planting', 'hardscape', 'sod'],
  'Sitework/Earthwork': ['excavation', 'grading', 'utility', 'paving', 'drain'],
  Demolition: ['demolition', 'abatement', 'disposal', 'protection'],
  Insulation: ['batt', 'spray foam', 'rigid', 'vapor barrier', 'fire stop'],
  Waterproofing: ['waterproofing', 'membrane', 'coating', 'drainage', 'sealant'],
}

// ============================================
// MAIN ANALYSIS FUNCTION
// ============================================

export interface AnalyzeBidQualityOptions {
  items: ExtractedItem[]
  tradeType: string
  totalBid: number
  averageBid?: number // Average across all bids for comparison
  allBidTotals?: number[] // All bid totals for outlier detection
}

export function analyzeBidQuality(
  options: AnalyzeBidQualityOptions
): BidQualityAnalysis {
  const { items, tradeType, totalBid, averageBid, allBidTotals } = options

  const redFlags: RedFlag[] = []

  // ============================================
  // RED FLAG DETECTION
  // ============================================

  // 1. Price outlier detection
  if (averageBid && allBidTotals && allBidTotals.length >= 2) {
    const priceRatio = totalBid / averageBid

    if (priceRatio < PRICE_OUTLIER_LOW_THRESHOLD) {
      redFlags.push({
        type: 'price_outlier_low',
        severity: priceRatio < 0.75 ? 'critical' : 'warning',
        description: `Bid is ${Math.round((1 - priceRatio) * 100)}% below average. May indicate missing scope or pricing errors.`,
        value: priceRatio,
      })
    } else if (priceRatio > PRICE_OUTLIER_HIGH_THRESHOLD) {
      redFlags.push({
        type: 'price_outlier_high',
        severity: priceRatio > 1.3 ? 'critical' : 'warning',
        description: `Bid is ${Math.round((priceRatio - 1) * 100)}% above average. May include additional scope or markup.`,
        value: priceRatio,
      })
    }
  }

  // 2. Excessive lump sums (items without quantity breakdown)
  const nonExclusionItems = items.filter((i) => !i.is_exclusion)
  const lumpSumItems = nonExclusionItems.filter(
    (i) => !i.quantity || i.unit?.toLowerCase() === 'ls'
  )
  const lumpSumRatio = nonExclusionItems.length > 0
    ? lumpSumItems.length / nonExclusionItems.length
    : 0

  if (lumpSumRatio > LUMP_SUM_THRESHOLD) {
    redFlags.push({
      type: 'excessive_lump_sums',
      severity: lumpSumRatio > 0.7 ? 'critical' : 'warning',
      description: `${Math.round(lumpSumRatio * 100)}% of items are lump sums without quantity breakdown. Makes comparison difficult.`,
      affectedItems: lumpSumItems.map((i) => i.description).slice(0, 5),
      value: lumpSumRatio,
    })
  }

  // 3. Excessive allowances
  const allowanceItems = items.filter(
    (i) =>
      i.description.toLowerCase().includes('allowance') ||
      i.category === 'allowance'
  )
  const allowanceTotal = allowanceItems.reduce(
    (sum, i) => sum + (i.total_price || 0),
    0
  )
  const allowanceRatio = totalBid > 0 ? allowanceTotal / totalBid : 0

  if (allowanceRatio > ALLOWANCE_THRESHOLD) {
    redFlags.push({
      type: 'excessive_allowances',
      severity: allowanceRatio > 0.2 ? 'critical' : 'warning',
      description: `Allowances represent ${Math.round(allowanceRatio * 100)}% of total bid. May indicate uncertain scope.`,
      affectedItems: allowanceItems.map((i) => i.description),
      value: allowanceRatio,
    })
  }

  // 4. Missing expected items
  const expectedItems = EXPECTED_ITEMS_BY_TRADE[tradeType] || []
  const itemDescriptionsLower = items.map((i) => i.description.toLowerCase())
  const missingItems = expectedItems.filter(
    (expected) =>
      !itemDescriptionsLower.some(
        (desc) =>
          desc.includes(expected.toLowerCase()) ||
          expected.toLowerCase().includes(desc)
      )
  )

  if (missingItems.length >= 3) {
    redFlags.push({
      type: 'missing_expected_items',
      severity: missingItems.length >= 5 ? 'critical' : 'warning',
      description: `Missing common ${tradeType} scope items: ${missingItems.slice(0, 3).join(', ')}${missingItems.length > 3 ? ` (+${missingItems.length - 3} more)` : ''}.`,
      affectedItems: missingItems,
    })
  }

  // 5. Low extraction confidence
  const avgConfidence =
    items.length > 0
      ? items.reduce((sum, i) => sum + i.confidence_score, 0) / items.length
      : 0

  if (avgConfidence < LOW_CONFIDENCE_THRESHOLD && items.length > 0) {
    const lowConfidenceItems = items.filter(
      (i) => i.confidence_score < LOW_CONFIDENCE_THRESHOLD
    )
    redFlags.push({
      type: 'low_extraction_confidence',
      severity: avgConfidence < 0.5 ? 'critical' : 'warning',
      description: `Average extraction confidence is ${Math.round(avgConfidence * 100)}%. ${lowConfidenceItems.length} items may need manual review.`,
      affectedItems: lowConfidenceItems.map((i) => i.description).slice(0, 5),
      value: avgConfidence,
    })
  }

  // 6. Vague descriptions
  const vagueItems = items.filter(
    (i) => i.description.length < VAGUE_DESCRIPTION_MIN_LENGTH
  )

  if (vagueItems.length >= 3) {
    redFlags.push({
      type: 'vague_descriptions',
      severity: vagueItems.length >= 5 ? 'warning' : 'warning',
      description: `${vagueItems.length} items have vague descriptions (< ${VAGUE_DESCRIPTION_MIN_LENGTH} characters).`,
      affectedItems: vagueItems.map((i) => i.description),
    })
  }

  // ============================================
  // COMPLETENESS SCORING
  // ============================================

  const factors = calculateCompletenessFactors(items, tradeType)
  const completenessScore = Math.round(
    factors.lineItemDetailScore +
      factors.exclusionsClarityScore +
      factors.scopeCoverageScore +
      factors.pricingCompletenessScore
  )

  // ============================================
  // RISK LEVEL ASSESSMENT
  // ============================================

  const criticalFlags = redFlags.filter((f) => f.severity === 'critical').length
  const warningFlags = redFlags.filter((f) => f.severity === 'warning').length

  let riskLevel: 'low' | 'medium' | 'high'
  if (criticalFlags >= 2 || completenessScore < 50) {
    riskLevel = 'high'
  } else if (criticalFlags >= 1 || warningFlags >= 3 || completenessScore < 70) {
    riskLevel = 'medium'
  } else {
    riskLevel = 'low'
  }

  return {
    completenessScore,
    factors,
    redFlags,
    riskLevel,
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function calculateCompletenessFactors(
  items: ExtractedItem[],
  tradeType: string
): BidQualityFactors {
  const nonExclusionItems = items.filter((i) => !i.is_exclusion)
  const exclusionItems = items.filter((i) => i.is_exclusion)

  // 1. Line Item Detail Score (0-30 pts)
  // Based on how many items have quantities, units, and unit prices
  let lineItemDetailScore = 0
  if (nonExclusionItems.length > 0) {
    const itemsWithQuantity = nonExclusionItems.filter((i) => i.quantity != null)
    const itemsWithUnit = nonExclusionItems.filter((i) => i.unit != null)
    const itemsWithUnitPrice = nonExclusionItems.filter(
      (i) => i.unit_price != null
    )

    const quantityRatio = itemsWithQuantity.length / nonExclusionItems.length
    const unitRatio = itemsWithUnit.length / nonExclusionItems.length
    const unitPriceRatio = itemsWithUnitPrice.length / nonExclusionItems.length

    lineItemDetailScore =
      quantityRatio * 10 + unitRatio * 10 + unitPriceRatio * 10
  }

  // 2. Exclusions Clarity Score (0-20 pts)
  // Based on whether exclusions are explicitly listed
  let exclusionsClarityScore = 0
  if (exclusionItems.length > 0) {
    // Has some exclusions listed - good
    exclusionsClarityScore = 10

    // Exclusions have descriptions - better
    const descriptiveExclusions = exclusionItems.filter(
      (i) => i.description.length >= 15
    )
    if (descriptiveExclusions.length / exclusionItems.length >= 0.5) {
      exclusionsClarityScore += 10
    } else {
      exclusionsClarityScore += 5
    }
  } else {
    // No exclusions could mean comprehensive bid OR missing exclusions
    // Give partial credit
    exclusionsClarityScore = 5
  }

  // 3. Scope Coverage Score (0-30 pts)
  // Based on percentage of expected trade items included
  const expectedItems = EXPECTED_ITEMS_BY_TRADE[tradeType] || []
  let scopeCoverageScore = 0

  if (expectedItems.length > 0) {
    const itemDescriptionsLower = items.map((i) => i.description.toLowerCase())
    const foundItems = expectedItems.filter((expected) =>
      itemDescriptionsLower.some(
        (desc) =>
          desc.includes(expected.toLowerCase()) ||
          expected.toLowerCase().includes(desc)
      )
    )
    const coverageRatio = foundItems.length / expectedItems.length
    scopeCoverageScore = coverageRatio * 30
  } else {
    // Unknown trade type - give moderate score based on item count
    scopeCoverageScore = Math.min(nonExclusionItems.length * 3, 30)
  }

  // 4. Pricing Completeness Score (0-20 pts)
  // Based on whether all items have prices
  let pricingCompletenessScore = 0
  if (nonExclusionItems.length > 0) {
    const itemsWithPrice = nonExclusionItems.filter(
      (i) => i.total_price != null && i.total_price > 0
    )
    const priceRatio = itemsWithPrice.length / nonExclusionItems.length
    pricingCompletenessScore = priceRatio * 20
  }

  return {
    lineItemDetailScore: Math.round(lineItemDetailScore),
    exclusionsClarityScore: Math.round(exclusionsClarityScore),
    scopeCoverageScore: Math.round(scopeCoverageScore),
    pricingCompletenessScore: Math.round(pricingCompletenessScore),
  }
}

/**
 * Get a text description of the risk level
 */
export function getRiskLevelDescription(
  riskLevel: 'low' | 'medium' | 'high'
): string {
  switch (riskLevel) {
    case 'low':
      return 'This bid appears complete and well-documented.'
    case 'medium':
      return 'This bid has some issues that may warrant clarification.'
    case 'high':
      return 'This bid has significant concerns that require careful review.'
  }
}

/**
 * Get color classes for risk level badges
 */
export function getRiskLevelColors(
  riskLevel: 'low' | 'medium' | 'high'
): { bg: string; text: string; border: string } {
  switch (riskLevel) {
    case 'low':
      return {
        bg: 'bg-green-50',
        text: 'text-green-700',
        border: 'border-green-200',
      }
    case 'medium':
      return {
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        border: 'border-amber-200',
      }
    case 'high':
      return {
        bg: 'bg-red-50',
        text: 'text-red-700',
        border: 'border-red-200',
      }
  }
}

/**
 * Get icon name for red flag type
 */
export function getRedFlagIcon(type: RedFlagType): string {
  switch (type) {
    case 'price_outlier_low':
    case 'price_outlier_high':
      return 'DollarSign'
    case 'excessive_lump_sums':
      return 'Package'
    case 'excessive_allowances':
      return 'AlertCircle'
    case 'missing_expected_items':
      return 'Search'
    case 'low_extraction_confidence':
      return 'HelpCircle'
    case 'vague_descriptions':
      return 'FileQuestion'
    default:
      return 'AlertTriangle'
  }
}
