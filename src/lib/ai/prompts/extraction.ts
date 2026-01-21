export function getExtractionPrompt(
  tradeType: string,
  documentText: string,
  learnedExamples?: string,
  learnedPatterns?: string,
  variantContent?: string
): string {
  const examplesSection = learnedExamples || ''
  const patternsSection = learnedPatterns || ''
  const variantSection = variantContent || ''

  return `You are an expert construction estimator analyzing a ${tradeType} subcontractor bid.

Your task is to extract all line items, pricing, and exclusions from this bid document and return them as structured JSON.

For each line item, extract:
- description: The scope item description (be specific and detailed)
- quantity: Numeric quantity if specified (null if not given)
- unit: Unit of measure if specified (SF, LF, EA, LS, etc.)
- unit_price: Price per unit if specified (null if not given)
- total_price: Total price for this item (required - estimate if needed)
- category: Category like "labor", "materials", "equipment", "permits", "general_conditions", "overhead", "other"
- is_exclusion: true if this is explicitly an excluded item
- is_inclusion: true if this is explicitly called out as included (common items often not listed)
- confidence_score: Your confidence in this extraction from 0.0 to 1.0
- raw_text: The original text this was extracted from
- notes: Any clarifying notes about this item

IMPORTANT EXTRACTION RULES:
1. Look for exclusion sections (often labeled "Exclusions", "Not Included", "By Others", "Clarifications")
2. Items with $0, "TBD", "NIC", or "By Others" are typically exclusions
3. Extract the base bid total if stated
4. Include all add-ons, alternates, and allowances as separate items
5. If a lump sum (LS) is given without breakdown, still extract it as a single item
6. For confidence_score:
   - 1.0: Clearly stated in document
   - 0.8: Reasonably inferred
   - 0.6: Some ambiguity
   - 0.4: Significant uncertainty
7. Set needs_review=true for items with confidence < 0.7

Common ${tradeType} scope items to look for:
${getTradeSpecificItems(tradeType)}
${patternsSection}${examplesSection}${variantSection}
Document text:
---
${documentText}
---

Return JSON in this exact format:
{
  "contractor_name": "extracted or inferred company name",
  "base_bid_total": number or null,
  "items": [
    {
      "description": "string",
      "quantity": number or null,
      "unit": "string or null",
      "unit_price": number or null,
      "total_price": number or null,
      "category": "string",
      "is_exclusion": boolean,
      "is_inclusion": boolean,
      "confidence_score": number,
      "needs_review": boolean,
      "raw_text": "string",
      "notes": "string or null"
    }
  ],
  "exclusions_summary": ["list of key exclusions as strings"],
  "inclusions_summary": ["list of key inclusions as strings"],
  "extraction_notes": "any overall notes about this document or extraction challenges"
}`
}

function getTradeSpecificItems(tradeType: string): string {
  const items: Record<string, string> = {
    Electrical: `
- Rough-in wiring and conduit
- Panel installation and service entrance
- Fixture installation (lighting, outlets, switches)
- Low voltage / data / communication wiring
- Fire alarm system
- Emergency/exit lighting
- Permit and inspection fees
- Temporary power
- Final connections and terminations
- Testing and commissioning`,
    Plumbing: `
- Rough-in piping (water supply, drain, waste, vent)
- Fixture installation (toilets, sinks, faucets)
- Water heater installation
- Gas piping
- Backflow prevention
- Permit and inspection fees
- Testing and commissioning
- Insulation
- Excavation/trenching`,
    HVAC: `
- Equipment (RTUs, splits, chillers, boilers)
- Ductwork fabrication and installation
- Piping (refrigerant, hydronic)
- Controls and thermostats
- Insulation
- Balancing and commissioning
- Permit fees
- Start-up services
- Sheet metal work`,
    Mechanical: `
- Equipment installation
- Piping systems
- Controls
- Insulation
- Testing and balancing
- Commissioning
- Permits`,
    "Fire Protection": `
- Sprinkler heads and piping
- Fire pump
- Standpipes
- Fire alarm integration
- Permits and inspections
- Testing and certification
- Backflow preventer`,
    Roofing: `
- Tear-off / removal
- Insulation
- Membrane / shingles / metal panels
- Flashing and trim
- Drainage (gutters, downspouts)
- Warranty
- Permits`,
    Concrete: `
- Forming
- Rebar / reinforcement
- Concrete placement
- Finishing
- Curing
- Pumping
- Testing`,
    Masonry: `
- Block / brick
- Mortar
- Reinforcement
- Scaffolding
- Waterproofing
- Flashing`,
    "Steel/Structural": `
- Fabrication
- Erection
- Connections
- Fireproofing
- Shop drawings
- Engineering`,
    "Drywall/Framing": `
- Metal studs / framing
- Drywall hanging
- Taping and finishing
- Insulation
- Acoustical treatment
- Fire-rated assemblies`,
    Painting: `
- Surface preparation
- Primer
- Paint (walls, trim, doors)
- Specialty coatings
- Touch-up`,
    Flooring: `
- Preparation / leveling
- Tile
- Carpet
- VCT / LVT
- Wood flooring
- Base / trim`,
    "Millwork/Casework": `
- Cabinets
- Countertops
- Trim and molding
- Custom millwork
- Hardware
- Installation`,
    "Glass/Glazing": `
- Storefront
- Curtain wall
- Windows
- Doors
- Hardware
- Sealants`,
    Landscaping: `
- Grading
- Irrigation
- Planting
- Hardscape
- Sod / seed
- Mulch`,
    "Sitework/Earthwork": `
- Excavation
- Grading
- Utilities
- Paving
- Curbs
- Drainage`,
    Demolition: `
- Selective demolition
- Abatement
- Disposal
- Protection
- Salvage`,
    Insulation: `
- Batt insulation
- Spray foam
- Rigid board
- Vapor barrier
- Fire stopping`,
    Waterproofing: `
- Below-grade waterproofing
- Foundation coating
- Dampproofing
- Drainage board
- Sealants`,
  }

  return items[tradeType] || `
- Labor
- Materials
- Equipment
- Permits
- General conditions
- Overhead and profit`
}
