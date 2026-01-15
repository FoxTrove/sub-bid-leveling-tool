interface ContractorSummaryInput {
  id: string
  name: string
  baseBid: number | null
  exclusionsCount: number
  exclusionsValue: number
  scopeGapsCount: number
  averageConfidence: number
}

interface ScopeGapInput {
  description: string
  missingFrom: string[]
  estimatedValue: number | null
}

export function getRecommendationPrompt(
  tradeType: string,
  contractors: ContractorSummaryInput[],
  scopeGaps: ScopeGapInput[]
): string {
  return `You are an expert construction estimator helping a general contractor choose between ${tradeType} subcontractor bids.

Here is a summary of each contractor's bid:
${JSON.stringify(contractors, null, 2)}

Key scope gaps identified:
${JSON.stringify(scopeGaps, null, 2)}

Based on this analysis, provide a recommendation that considers:
1. Total cost including likely value of exclusions
2. Completeness of scope coverage
3. Risk factors (many exclusions = higher change order risk)
4. Confidence in the bid (clear vs ambiguous)

IMPORTANT:
- The lowest base bid is NOT always the best value
- A bid with fewer exclusions may be better even if slightly higher
- Missing scope items will need to be added later
- Consider the "true" cost after accounting for gaps and exclusions

Return JSON in this exact format:
{
  "recommended_contractor_id": "uuid of recommended contractor",
  "recommended_contractor_name": "name",
  "confidence": "high" | "medium" | "low",
  "reasoning": "2-3 sentence explanation of why this contractor is recommended",
  "key_factors": [
    {
      "factor": "short factor name",
      "description": "explanation"
    }
  ],
  "warnings": [
    {
      "contractor_id": "uuid if specific to one, null if general",
      "type": "exclusion_risk" | "scope_gap" | "price_concern" | "other",
      "description": "warning message"
    }
  ],
  "price_analysis": {
    "lowest_base_bid": { "contractor_name": "name", "amount": number },
    "estimated_true_cost": [
      { "contractor_name": "name", "base": number, "estimated_adds": number, "total": number }
    ]
  }
}`
}
