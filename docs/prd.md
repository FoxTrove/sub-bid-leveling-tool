# Sub Bid Leveling Tool - Product Requirements Document

## Overview

A free, AI-powered tool that helps construction general contractors (GCs) compare subcontractor bids apples-to-apples. Upload 3-5 bids for the same scope, and the tool normalizes, analyzes, and presents a clear comparison highlighting scope gaps, exclusions, true pricing, and recommendations.

**Target Users**: Commercial and residential construction GCs
**Business Model**: Free lead magnet tool (captures email for marketing pipeline)
**Branding**: Standalone product brand (separate from Elder Construction)

---

## Problem Statement

GCs spend 2-4 hours manually leveling subcontractor bids in spreadsheets for every bid they pursue. This involves:
- Reading through multiple PDFs/documents
- Extracting scope items and pricing
- Identifying what each sub included/excluded
- Normalizing data to compare fairly
- Making a recommendation

This is tedious, error-prone, and repeated constantly across the industry.

---

## Solution

An AI-powered web application that:
1. Accepts uploaded bid documents (PDF, Excel, Word)
2. Extracts and normalizes scope items, pricing, and exclusions
3. Generates an interactive comparison view
4. Flags scope gaps and exclusions
5. Provides a recommendation with confidence indicators
6. Exports results as a professional PDF report

---

## User Stories

### Authentication
- As a user, I can sign up with just my email address (magic link)
- As a user, I receive a login link via email with no password to remember
- As a user, I stay logged in across sessions until I explicitly log out

### Project & Bid Upload
- As a user, I can create a new comparison project with a name
- As a user, I can optionally add project details (location, size, deadline)
- As a user, I can upload 3-5 bid documents per comparison
- As a user, I can upload PDFs, Excel/CSV files, and Word documents
- As a user, I can specify the trade/scope type (electrical, plumbing, etc.)

### AI Analysis
- As a user, I can trigger analysis after uploading all bids
- As a user, I see a loading state while AI processes documents
- As a user, I see items flagged when AI confidence is low (for my review)

### Comparison View
- As a user, I see a normalized side-by-side comparison of all bids
- As a user, I can clearly identify scope gaps (what's missing from each bid)
- As a user, I can see exclusion flags highlighted
- As a user, I see true price comparison (base bid + identified add-ons)
- As a user, I see an AI-generated recommendation with reasoning

### Export & History
- As a user, I can export the comparison as a formatted PDF report
- As a user, I can view my past comparisons from a dashboard
- As a user, I can re-open and re-export previous comparisons

---

## Functional Requirements

### 1. Authentication System
| Requirement | Details |
|-------------|---------|
| Method | Email magic link (passwordless) |
| Session | Persistent until logout |
| Email capture | Required before first use |
| Account data | Email, name (optional), company (optional) |

### 2. Document Upload & Processing
| Requirement | Details |
|-------------|---------|
| Supported formats | PDF, XLSX, XLS, CSV, DOC, DOCX |
| Max file size | 25MB per document |
| Bids per comparison | 3-5 documents |
| Storage | Cloud storage (S3 or equivalent) |

### 3. AI Analysis Engine
| Requirement | Details |
|-------------|---------|
| Extraction | Scope items, quantities, unit prices, totals, exclusions |
| Normalization | Map similar items across bids, standardize units |
| Confidence scoring | Flag low-confidence extractions for human review |
| Scope gap detection | Identify items present in some bids but not others |
| Recommendation | AI-generated pick with reasoning |

### 4. Comparison Interface
| Requirement | Details |
|-------------|---------|
| Layout | Side-by-side comparison grid |
| Highlighting | Visual flags for gaps, exclusions, discrepancies |
| Sorting | By category, price, confidence |
| Filtering | Show all / gaps only / exclusions only |
| Editing | Allow user to manually correct AI extractions |

### 5. Export & Reporting
| Requirement | Details |
|-------------|---------|
| PDF export | Branded, professional report layout |
| Content | Summary, detailed comparison, recommendation, notes |
| Shareable | Download link valid for X days |

### 6. User Dashboard
| Requirement | Details |
|-------------|---------|
| Comparison history | List of all past comparisons |
| Quick actions | View, export, delete |
| Search/filter | By project name, date, trade |

---

## Non-Functional Requirements

### Performance
- Document upload: < 30 seconds for 25MB file
- AI analysis: < 2 minutes for 5 documents
- Page load: < 2 seconds

### Responsiveness
- Fully responsive design (mobile, tablet, desktop)
- Mobile-first approach for all views
- Touch-friendly interface elements

### Security
- HTTPS everywhere
- Secure document storage with encryption at rest
- Magic links expire after 15 minutes
- Session tokens with secure, httpOnly cookies

### Scalability
- Support concurrent users without degradation
- Queue system for AI processing during high load

---

## Technical Architecture (Recommended)

### Frontend
- **Framework**: Next.js 14+ (App Router)
- **Styling**: Tailwind CSS
- **Components**: shadcn/ui
- **State**: React Context + Server Components

### Backend
- **API**: Next.js API Routes / Server Actions
- **Database**: PostgreSQL (via Supabase or Neon)
- **Auth**: Custom magic link or Auth.js
- **File Storage**: AWS S3 or Cloudflare R2

### AI/ML
- **Document parsing**: PDF.js, Mammoth.js (Word), xlsx library
- **LLM**: OpenAI GPT-4 or Claude for extraction/analysis
- **Structured output**: JSON mode for consistent parsing

### Infrastructure
- **Hosting**: Vercel
- **Database**: Supabase / Neon / PlanetScale
- **File storage**: S3-compatible (R2, S3)
- **Email**: Resend or SendGrid (magic links)

---

## Data Model

### User
```
id: uuid
email: string (unique)
name: string (optional)
company: string (optional)
created_at: timestamp
last_login: timestamp
```

### Project (Comparison)
```
id: uuid
user_id: uuid (FK)
name: string
trade_type: string
location: string (optional)
project_size: string (optional)
deadline: date (optional)
status: enum (draft, processing, complete, error)
created_at: timestamp
updated_at: timestamp
```

### Bid Document
```
id: uuid
project_id: uuid (FK)
contractor_name: string
file_url: string
file_type: string
file_size: integer
upload_status: enum (uploading, uploaded, processing, processed, error)
created_at: timestamp
```

### Extracted Line Item
```
id: uuid
bid_document_id: uuid (FK)
description: string
quantity: decimal (optional)
unit: string (optional)
unit_price: decimal (optional)
total_price: decimal
category: string
is_exclusion: boolean
confidence_score: decimal (0-1)
needs_review: boolean
raw_text: string
created_at: timestamp
```

### Comparison Result
```
id: uuid
project_id: uuid (FK)
summary: json
recommendation: json
generated_at: timestamp
```

---

## UI/UX Wireframes (Conceptual)

### 1. Landing Page
- Hero: Value prop + CTA "Level Your Bids Free"
- How it works (3 steps)
- Email capture form
- Trust indicators (testimonials, logos if available)

### 2. Dashboard
- Header: Logo, user menu
- "New Comparison" button (prominent)
- List of past comparisons (cards or table)
- Each card: Project name, trade, date, status, quick actions

### 3. New Comparison Flow
- Step 1: Project details (name required, others optional)
- Step 2: Select trade/scope type
- Step 3: Upload bids (drag-drop zone, 3-5 files)
- Step 4: Review uploads, name each contractor
- Step 5: "Analyze Bids" button → processing state

### 4. Comparison Results View
- Header: Project name, export button
- Summary cards: Total bids, price range, recommended
- Comparison grid: Rows = scope items, Columns = contractors
- Color coding: Green (included), Red (excluded/missing), Yellow (review needed)
- Expandable rows for details
- Recommendation section with reasoning
- Floating "Export PDF" button

### 5. PDF Export
- Cover page: Project name, date, your branding
- Executive summary
- Detailed comparison table
- Scope gaps section
- Exclusions section
- Recommendation with confidence notes
- Footer: Generated by [Tool Name]

---

## MVP Scope

### Phase 1 (MVP)
- [ ] Landing page with email capture
- [ ] Magic link authentication
- [ ] New comparison creation
- [ ] Document upload (PDF focus, Excel secondary)
- [ ] AI extraction and normalization
- [ ] Basic comparison view
- [ ] Scope gap highlighting
- [ ] Exclusion flagging
- [ ] Simple recommendation
- [ ] PDF export
- [ ] Comparison history
- [ ] Fully responsive design

### Phase 2 (Post-MVP)
- [ ] Word document support
- [ ] Improved AI accuracy (fine-tuned prompts)
- [ ] Manual editing of extracted data
- [ ] Shareable comparison links
- [ ] Email notifications
- [ ] Trade-specific scope templates
- [ ] Bulk re-analysis

### Phase 3 (Future)
- [ ] Team accounts
- [ ] API access
- [ ] Integrations (Procore, BuilderTrend, etc.)
- [ ] Historical pricing intelligence

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Email signups | Track monthly growth |
| Comparisons created | Track usage frequency |
| Completion rate | % of started comparisons that finish |
| Return users | Users who create 2+ comparisons |
| PDF exports | Track as engagement metric |
| Time on site | Benchmark and improve |

---

## Open Questions

1. **Branding**: What will the standalone product be called?
2. **AI Provider**: OpenAI vs Claude vs other? (cost/accuracy tradeoff)
3. **PDF Parsing**: How structured are typical sub bids? May need OCR for scanned docs.
4. **Legal**: Any disclaimers needed around AI recommendations?
5. **Lead Nurture**: What's the follow-up sequence after email capture?

---

## Appendix

### Sample Scope Items (Electrical)
- Rough-in wiring
- Panel installation
- Fixture installation
- Low voltage / data
- Permit fees
- Final connections
- Testing & commissioning

### Common Exclusions to Flag
- Permit fees
- Bonding
- After-hours work
- Material escalation
- Change orders
- Equipment rental
- Site cleanup
