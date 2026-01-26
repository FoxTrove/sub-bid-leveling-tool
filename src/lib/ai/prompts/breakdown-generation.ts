/**
 * AI Prompt for generating breakdown/grouping options for bid comparison.
 *
 * This prompt analyzes document samples and the trade type to suggest
 * 2-3 different ways to organize/group scope items.
 */

import type { BreakdownType, BreakdownStructure } from '@/types'

export interface BreakdownOptionResult {
  type: BreakdownType
  structure: BreakdownStructure
  confidence: number
  explanation: string
  isRecommended: boolean
}

export interface BreakdownGenerationResult {
  options: BreakdownOptionResult[]
  analysis_notes: string
}

/**
 * Generate the prompt for breakdown option analysis
 */
export function getBreakdownGenerationPrompt(
  tradeType: string,
  documentSamples: { contractorName: string; textSample: string }[],
  existingCategories?: string[]
): string {
  const samplesText = documentSamples
    .map((d, i) => `--- Document ${i + 1}: ${d.contractorName} ---\n${d.textSample}`)
    .join('\n\n')

  const existingCategoriesText = existingCategories?.length
    ? `\n\nExisting categories found in these bids: ${existingCategories.join(', ')}`
    : ''

  return `You are an expert construction estimator helping organize bid comparison data for a ${tradeType} project.

Your task is to analyze the document samples below and suggest 2-3 different ways to GROUP and ORGANIZE scope items for comparison. The user will select the grouping strategy that makes most sense for their project.

${getTradeSpecificBreakdownGuidance(tradeType)}

DOCUMENT SAMPLES:
${samplesText}
${existingCategoriesText}

BREAKDOWN STRATEGY RULES:
1. Suggest 2-3 distinct grouping strategies based on patterns in the documents
2. Each strategy should make sense for comparing ${tradeType} bids
3. Consider what the estimator needs to compare (location vs materials vs phases)
4. Mark ONE option as recommended based on document structure
5. Each breakdown should have 3-8 top-level categories
6. Categories can have nested subcategories (max 2 levels deep)
7. Use clear, industry-standard terminology

COMMON BREAKDOWN TYPES:
- by_location: Organize by building areas (floors, zones, wings)
- by_material: Organize by material or equipment types
- by_phase: Organize by construction phases (rough-in, finish, commissioning)
- by_system: Organize by building systems (power, lighting, controls)
- by_unit: Organize by unit types (Unit A, Unit B, common areas) - for multi-family
- by_floor: Organize strictly by floor levels
- by_area: Organize by functional areas (lobby, offices, parking)

Return JSON in this exact format:
{
  "options": [
    {
      "type": "by_location | by_material | by_phase | by_system | by_unit | by_floor | by_area | custom",
      "structure": {
        "type": "the breakdown type",
        "nodes": [
          {
            "id": "unique-id-1",
            "name": "Category Name",
            "children": [
              { "id": "unique-id-1-1", "name": "Subcategory Name" }
            ]
          }
        ]
      },
      "confidence": 0.85,
      "explanation": "Why this breakdown makes sense for these documents",
      "isRecommended": true
    }
  ],
  "analysis_notes": "Overall notes about the document structure and patterns observed"
}`
}

/**
 * Trade-specific guidance for breakdown strategies
 */
function getTradeSpecificBreakdownGuidance(tradeType: string): string {
  const guidance: Record<string, string> = {
    Electrical: `
For ELECTRICAL bids, common breakdown strategies include:
- BY SYSTEM: Power distribution, Lighting, Fire alarm, Low voltage, Controls
- BY PHASE: Rough-in/underground, Rough-in/above grade, Trim/finish, Testing/commissioning
- BY LOCATION: Floor-by-floor, Zone-by-zone, Building-by-building
- BY MATERIAL: Conduit/wiring, Fixtures, Panels/equipment, Controls/devices

Look for: panel schedules, fixture schedules, one-line diagrams references, circuit assignments.`,

    Plumbing: `
For PLUMBING bids, common breakdown strategies include:
- BY SYSTEM: Domestic water, Sanitary/waste, Storm drainage, Gas piping, Specialty systems
- BY FIXTURE TYPE: Restroom fixtures, Kitchen equipment, Specialty fixtures
- BY LOCATION: Floor-by-floor, Core areas vs tenant spaces
- BY PHASE: Underground/slab, Rough-in, Finish/trim

Look for: fixture schedules, riser diagrams, equipment specifications.`,

    HVAC: `
For HVAC bids, common breakdown strategies include:
- BY SYSTEM: Heating, Cooling, Ventilation, Controls, Exhaust
- BY EQUIPMENT: RTUs, Split systems, VAV boxes, Ductwork, Piping
- BY ZONE: Temperature control zones, Air handling zones
- BY PHASE: Equipment procurement, Rough-in, Ductwork, Piping, Controls, Startup

Look for: equipment schedules, zoning diagrams, control sequences.`,

    'Fire Protection': `
For FIRE PROTECTION bids, common breakdown strategies include:
- BY SYSTEM TYPE: Wet sprinkler, Dry sprinkler, Pre-action, Standpipe, Fire pump
- BY HAZARD LEVEL: Light hazard, Ordinary hazard, High hazard
- BY LOCATION: Floor-by-floor, Zone-by-zone
- BY COMPONENT: Piping, Heads, Valves, Alarms, Pump

Look for: hydraulic calculations, sprinkler layouts, riser diagrams.`,

    Concrete: `
For CONCRETE bids, common breakdown strategies include:
- BY ELEMENT: Footings, Foundation walls, SOG, Elevated slabs, Columns, Beams
- BY LOCATION: Building areas, Parking structures, Sitework
- BY PHASE: Excavation prep, Formwork, Reinforcing, Placing, Finishing

Look for: structural drawings references, mix designs, reinforcing schedules.`,

    'Drywall/Framing': `
For DRYWALL/FRAMING bids, common breakdown strategies include:
- BY SYSTEM: Metal framing, Drywall, Acoustical ceilings, Specialties
- BY AREA TYPE: Office areas, Corridors, Restrooms, Specialty rooms
- BY LEVEL: Elevation/complexity (standard, fire-rated, moisture-resistant)
- BY PHASE: Framing, Boarding, Taping/finishing, Acoustical

Look for: wall types, ceiling heights, fire rating requirements.`,

    Roofing: `
For ROOFING bids, common breakdown strategies include:
- BY SYSTEM: Membrane, Insulation, Flashing, Drainage, Accessories
- BY ROOF AREA: Main roof, Lower roofs, Canopies, Equipment screens
- BY WARRANTY: 10-year, 20-year, 30-year systems
- BY PHASE: Tear-off, Substrate prep, Insulation, Membrane, Flashing

Look for: roof plans, detail references, warranty requirements.`,
  }

  return guidance[tradeType] || `
For ${tradeType} bids, consider:
- Breaking down by major scope categories specific to this trade
- Organizing by location if the documents reference building areas
- Grouping by phase if the bid shows clear sequencing
- Categorizing by material/equipment types if detailed schedules exist`
}

/**
 * Validate and parse breakdown generation response
 */
export function parseBreakdownResponse(response: string): BreakdownGenerationResult {
  const parsed = JSON.parse(response)

  // Validate structure
  if (!parsed.options || !Array.isArray(parsed.options)) {
    throw new Error('Invalid breakdown response: missing options array')
  }

  // Ensure at least one option
  if (parsed.options.length === 0) {
    throw new Error('Invalid breakdown response: no options provided')
  }

  // Validate each option
  for (const option of parsed.options) {
    if (!option.type || !option.structure || !option.structure.nodes) {
      throw new Error('Invalid breakdown option: missing required fields')
    }

    // Ensure unique IDs
    const ids = new Set<string>()
    validateNodeIds(option.structure.nodes, ids)
  }

  return parsed as BreakdownGenerationResult
}

/**
 * Recursively validate that all node IDs are unique
 */
function validateNodeIds(nodes: { id: string; children?: { id: string }[] }[], ids: Set<string>) {
  for (const node of nodes) {
    if (ids.has(node.id)) {
      throw new Error(`Duplicate node ID: ${node.id}`)
    }
    ids.add(node.id)

    if (node.children) {
      validateNodeIds(node.children as typeof nodes, ids)
    }
  }
}

/**
 * Generate a simple default breakdown structure when AI generation fails
 */
export function getDefaultBreakdownOptions(tradeType: string): BreakdownGenerationResult {
  const defaultCategories = [
    { id: 'labor', name: 'Labor' },
    { id: 'materials', name: 'Materials' },
    { id: 'equipment', name: 'Equipment' },
    { id: 'general', name: 'General Conditions' },
    { id: 'other', name: 'Other' },
  ]

  return {
    options: [
      {
        type: 'by_material' as BreakdownType,
        structure: {
          type: 'by_material' as BreakdownType,
          nodes: defaultCategories,
        },
        confidence: 0.5,
        explanation: `Default breakdown by cost category for ${tradeType}. AI analysis was not available.`,
        isRecommended: true,
      },
    ],
    analysis_notes: 'Using default breakdown structure. AI-powered analysis was not available.',
  }
}
