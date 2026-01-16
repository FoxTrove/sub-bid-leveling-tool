import type { ExtractedItem } from "@/types"

interface ContractorItems {
  contractorId: string
  contractorName: string
  items: ExtractedItem[]
}

export function getNormalizationPrompt(
  tradeType: string,
  contractors: ContractorItems[],
  learnedExamples?: string
): string {
  const examplesSection = learnedExamples || ''
  const itemsJson = contractors.map((c) => ({
    contractor_id: c.contractorId,
    contractor_name: c.contractorName,
    items: c.items.map((item) => ({
      id: item.id,
      description: item.description,
      total_price: item.total_price,
      category: item.category,
      is_exclusion: item.is_exclusion,
    })),
  }))

  return `You are an expert construction estimator analyzing ${tradeType} bids from multiple contractors.

Your task is to normalize and match scope items across all bids so they can be compared apples-to-apples.

Here are the extracted items from each contractor:
${JSON.stringify(itemsJson, null, 2)}

For each unique scope item across all bids, create a normalized entry that:
1. Has a standardized description (e.g., "Rough-in Wiring" not "rough in" or "wire rough")
2. Lists which contractors include it, which exclude it, and which don't mention it
3. Shows the price from each contractor who includes it
4. Identifies it as a "scope gap" if not all contractors have it

MATCHING RULES:
- Match items by semantic meaning, not exact wording
- "Electrical rough" and "Rough-in wiring" are the same
- "NIC" / "By Others" / "$0" items should be treated as exclusions
- If one contractor has a detailed breakdown and another has a lump sum, note this
- Group related items under standard categories
${examplesSection}
Return JSON in this exact format:
{
  "normalized_items": [
    {
      "normalized_description": "Standard description for this scope item",
      "category": "category name",
      "contractors": [
        {
          "contractor_id": "uuid",
          "contractor_name": "name",
          "status": "included" | "excluded" | "not_mentioned",
          "price": number or null,
          "original_description": "their wording",
          "original_item_id": "uuid of matched item" or null
        }
      ],
      "is_scope_gap": boolean,
      "gap_notes": "explanation of gap if applicable"
    }
  ],
  "normalization_notes": "any overall notes about the comparison"
}`
}
