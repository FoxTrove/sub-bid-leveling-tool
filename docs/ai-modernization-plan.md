# BidVet AI modernization plan

## Current state

The app currently has a text-first pipeline:

1. Extract text from PDF/Excel/Word/CSV.
2. Ask one model to extract bid items as JSON.
3. Ask one model to normalize items across bidders.
4. Ask one model to recommend a contractor.

That works for clean text and spreadsheets, but construction bids often contain scanned pages, tables, alternates, handwritten notes, page headers, footers, and layout-dependent exclusions. A text-only pass loses too much signal.

## Recommended architecture

### 1. Intake classifier

Use a low-cost model to classify each file before extraction:

- digital text PDF
- scanned/image PDF
- spreadsheet
- Word document
- mixed package with drawings/specs/attachments
- unreadable or unsupported

Output should include page count, detected tables, likely trade, and extraction strategy.

Recommended model: `gpt-5-mini` or `gpt-4.1-mini`.

### 2. Multimodal document extraction

For PDFs and scans, use a vision-capable model with file inputs instead of only `pdf-parse`. The extraction response should preserve citations back to page numbers and source snippets.

Recommended model: `gpt-5-mini` for standard bids, escalating to `gpt-5.2` or `gpt-5.1` only when confidence is low, documents are highly visual, or the first pass fails.

Output shape:

```json
{
  "contractor_name": "string",
  "base_bid_total": 12345,
  "items": [],
  "alternates": [],
  "allowances": [],
  "exclusions": [],
  "clarifications": [],
  "source_citations": [
    {
      "field": "base_bid_total",
      "page": 2,
      "source_text": "Base Bid: $123,456"
    }
  ],
  "confidence": 0.92,
  "needs_human_review": false
}
```

### 3. Deterministic validation layer

Before normalization, run deterministic checks:

- totals add up when line items are available
- base bid total exists for each contractor
- every contractor has at least one priced item or a stated lump sum
- at least two bidders have usable extraction
- exclusions and alternates are separated from base scope
- suspicious zero-dollar totals are flagged

If validation fails, mark the project `error` or `needs_review` instead of generating a polished but unreliable recommendation.

### 4. Normalization with embeddings plus model judgment

Normalize in two passes:

1. Use embeddings or fuzzy grouping to cluster semantically similar scope items.
2. Use a stronger reasoning model to resolve ambiguous matches, exclusions, alternates, and contractor-specific scope gaps.

Recommended:

- `text-embedding-3-small` for inexpensive item clustering.
- `gpt-5-mini` for standard normalization.
- Escalate to `gpt-5.2`/`gpt-5.1` when scope gaps materially affect recommendation.

### 5. Recommendation model

Recommendation should not only choose a contractor. It should produce:

- lowest bid
- adjusted likely cost
- missing scope risk
- exclusions risk
- data quality score
- confidence and reasons to review manually

Recommended model: `gpt-5.1` or `gpt-5.2` for final recommendation when the decision affects money; `gpt-5-mini` is acceptable for draft/preview.

## Model routing

| Task | Default | Escalate when |
| --- | --- | --- |
| File classification | `gpt-5-mini` | rarely |
| CSV/XLSX extraction | deterministic parser + `gpt-5-mini` | low confidence |
| Digital PDF extraction | `gpt-5-mini` with file input | tables/scans fail |
| Scanned PDF extraction | vision-capable `gpt-5-mini` | low confidence |
| Normalization | embeddings + `gpt-5-mini` | major gaps or low confidence |
| Recommendation | `gpt-5-mini` | high-dollar or low-confidence result |
| Final QA | `gpt-5.1`/`gpt-5.2` | before user-facing recommendation |

## Implementation phases

### Phase 1: Reliability

- Block recommendations unless at least two bids have usable extracted totals/items.
- Store per-field citations and confidence.
- Add `needs_review` project state or explicit warning state.
- Stop charging credits for startup failures.

### Phase 2: Multimodal extraction

- Add a file-input extraction path for PDFs.
- Route scanned/image PDFs to vision extraction.
- Keep deterministic spreadsheet parsing for CSV/XLSX, then ask the model only to classify and normalize.

### Phase 3: Model routing and cost control

- Add model constants per task instead of a single global `OPENAI_MODEL`.
- Track token usage and extraction confidence per document.
- Escalate only failed or low-confidence documents.
- Cache extraction results by file hash.

### Phase 4: Evaluation

- Build fixtures from the current `test-bids` and real anonymized examples.
- Score extraction accuracy, total bid detection, scope-gap recall, and recommendation stability.
- Require a passing fixture replay before changing prompts or model routes.

## References

- OpenAI file inputs and PDF support: https://platform.openai.com/docs/guides/pdf-files
- OpenAI Responses API and structured outputs: https://platform.openai.com/docs/api-reference/responses
- OpenAI model list: https://platform.openai.com/docs/models

