# GA4 Custom Definitions Setup Guide

This guide walks you through setting up custom dimensions and metrics in GA4 for BidLevel analytics.

## Why Custom Definitions?

Google Analytics 4 automatically captures some event parameters, but to use custom parameters (like `product`, `promo_code`, `comparison_id`) in reports, explorations, and audiences, you need to register them as **custom dimensions** or **custom metrics**.

---

## How to Create Custom Definitions

1. Go to [Google Analytics](https://analytics.google.com/)
2. Navigate to **Admin** (gear icon, bottom left)
3. Under **Data display**, click **Custom definitions**
4. Click **Create custom dimension** (or metric)

---

## Required Custom Dimensions

Create each of these custom dimensions in GA4:

### 1. Product Identifier (CRITICAL)

This is the most important dimension - enables cross-product filtering.

| Field | Value |
|-------|-------|
| **Dimension name** | Product |
| **Scope** | Event |
| **Event parameter** | `product` |
| **Description** | Identifies which product (bidlevel, foxtrove_main, etc.) |

**Values:** `bidlevel`, `foxtrove_main`

---

### 2. Promo Code

Track which promotional codes drive signups and conversions.

| Field | Value |
|-------|-------|
| **Dimension name** | Promo Code |
| **Scope** | Event |
| **Event parameter** | `promo_code` |
| **Description** | Promotional code used during signup |

**Values:** `HANDSHAKE`, `GC-PARTNER`, etc.

---

### 3. Invite Token

Track which invite links drive traffic.

| Field | Value |
|-------|-------|
| **Dimension name** | Invite Token |
| **Scope** | Event |
| **Event parameter** | `invite_token` |
| **Description** | Token from invite URL |

**Values:** `HANDSHAKE2026`, `GC-PARTNER`, etc.

---

### 4. Authentication Method

Track how users sign up and log in.

| Field | Value |
|-------|-------|
| **Dimension name** | Auth Method |
| **Scope** | Event |
| **Event parameter** | `method` |
| **Description** | Authentication method (magic_link, password, oauth) |

**Values:** `magic_link`, `password`, `oauth`

---

### 5. Purchase Type

Distinguish between subscription and credit purchases.

| Field | Value |
|-------|-------|
| **Dimension name** | Purchase Type |
| **Scope** | Event |
| **Event parameter** | `purchase_type` |
| **Description** | Type of purchase |

**Values:** `subscription_monthly`, `subscription_annual`, `credits`

---

### 6. Comparison ID

Track individual comparison projects through their lifecycle.

| Field | Value |
|-------|-------|
| **Dimension name** | Comparison ID |
| **Scope** | Event |
| **Event parameter** | `comparison_id` |
| **Description** | Unique ID for bid comparison projects |

---

### 7. Document Types

Track what file types users upload.

| Field | Value |
|-------|-------|
| **Dimension name** | Document Types |
| **Scope** | Event |
| **Event parameter** | `document_types` |
| **Description** | Comma-separated file types (pdf, xlsx, etc.) |

**Example Values:** `pdf`, `xlsx`, `pdf,xlsx,docx`

---

### 8. Error Type

Track what kinds of errors users encounter.

| Field | Value |
|-------|-------|
| **Dimension name** | Error Type |
| **Scope** | Event |
| **Event parameter** | `error_type` |
| **Description** | Type of error encountered |

**Values:** `size_exceeded`, `invalid_type`, `upload_failed`, `submit_failed`, etc.

---

### 9. Form Name

Track which forms users interact with.

| Field | Value |
|-------|-------|
| **Dimension name** | Form Name |
| **Scope** | Event |
| **Event parameter** | `form_name` |
| **Description** | Name of the form |

**Values:** `comparison_wizard`, `onboarding`, `login`, etc.

---

### 10. Step Name

Track step progression through wizards and forms.

| Field | Value |
|-------|-------|
| **Dimension name** | Step Name |
| **Scope** | Event |
| **Event parameter** | `step_name` |
| **Description** | Name of the current step |

**Values:** `Project Details`, `Trade Type`, `Upload Bids`, etc.

---

### 11. Modal Type

Track which modals users interact with.

| Field | Value |
|-------|-------|
| **Dimension name** | Modal Type |
| **Scope** | Event |
| **Event parameter** | `modal_type` |
| **Description** | Type of modal opened/closed |

---

### 12. Export Format

Track which export formats users prefer.

| Field | Value |
|-------|-------|
| **Dimension name** | Export Format |
| **Scope** | Event |
| **Event parameter** | `format` |
| **Description** | Export file format |

**Values:** `pdf`, `csv`

---

### 13. Source/Location

Track where users trigger actions from.

| Field | Value |
|-------|-------|
| **Dimension name** | Source |
| **Scope** | Event |
| **Event parameter** | `source` |
| **Description** | Where the action was triggered from |

**Values:** `dashboard`, `folder`, `cta`, `empty_state`, etc.

---

## Optional Custom Metrics

For numeric data you want to aggregate, create custom metrics:

### 1. Document Count

| Field | Value |
|-------|-------|
| **Metric name** | Document Count |
| **Scope** | Event |
| **Event parameter** | `document_count` |
| **Unit of measurement** | Standard |
| **Description** | Number of documents uploaded |

---

### 2. Total File Size (MB)

| Field | Value |
|-------|-------|
| **Metric name** | Total File Size MB |
| **Scope** | Event |
| **Event parameter** | `total_size_mb` |
| **Unit of measurement** | Standard |
| **Description** | Total size of uploaded files in MB |

---

### 3. Step Number

| Field | Value |
|-------|-------|
| **Metric name** | Step Number |
| **Scope** | Event |
| **Event parameter** | `step_number` |
| **Unit of measurement** | Standard |
| **Description** | Current step in a multi-step flow |

---

### 4. Processing Time (seconds)

| Field | Value |
|-------|-------|
| **Metric name** | Processing Time Seconds |
| **Scope** | Event |
| **Event parameter** | `processing_time_seconds` |
| **Unit of measurement** | Duration (seconds) |
| **Description** | Time taken for AI processing |

---

## Key Events (Conversions)

After creating dimensions, mark these events as **Key Events**:

1. Go to **Admin** > **Data display** > **Key events**
2. Click **Create event** > **without code**
3. Add each event name:

| Event Name | Why It Matters |
|------------|----------------|
| `sign_up` | New user acquisition |
| `purchase` | Revenue conversion |
| `api_key_added` | User activation (BYOK) |
| `processing_completed` | Product value delivered |
| `comparison_exported` | User got deliverable value |
| `promo_code_applied` | Campaign tracking |

---

## Testing Custom Definitions

After creating definitions, test them:

1. Enable **Debug View** in GA4:
   - Go to **Admin** > **Data display** > **DebugView**

2. Install the [GA Debugger extension](https://chrome.google.com/webstore/detail/google-analytics-debugger/jnkmfdileelhofjcijamephohjechhna)

3. Visit BidLevel and perform actions

4. Check DebugView - you should see events with your custom parameters

---

## Creating Reports with Custom Dimensions

### Product-Filtered Report

1. Go to **Reports** > **Engagement** > **Events**
2. Click **Add filter**
3. Select **Product** = `bidlevel`
4. Save the report

### Promo Code Funnel

1. Go to **Explore**
2. Create new **Funnel exploration**
3. Steps:
   - `invite_link_viewed` where `promo_code` = `HANDSHAKE`
   - `sign_up` where `promo_code` = `HANDSHAKE`
   - `api_key_added`
   - `processing_completed`

### Comparison Completion Rate

1. Go to **Explore**
2. Create new **Free form** report
3. Rows: `Step Name`
4. Values: Event count
5. Filter by event `comparison_step`

---

## Quick Reference: Events and Parameters

| Event | Key Parameters |
|-------|----------------|
| `sign_up` | `product`, `method`, `promo_code` |
| `login` | `product`, `method` |
| `invite_link_viewed` | `product`, `invite_token`, `promo_code` |
| `promo_code_applied` | `product`, `promo_code` |
| `comparison_started` | `product`, `source` |
| `comparison_step` | `product`, `step_number`, `step_name` |
| `documents_uploaded` | `product`, `document_count`, `document_types`, `total_size_mb` |
| `processing_started` | `product`, `comparison_id`, `document_count` |
| `processing_completed` | `product`, `comparison_id`, `processing_time_seconds` |
| `results_viewed` | `product`, `comparison_id` |
| `comparison_exported` | `product`, `comparison_id`, `format` |
| `purchase` | `product`, `value`, `currency`, `transaction_id`, `purchase_type` |
| `submission_error` | `product`, `form_name`, `error_type` |
| `upload_error` | `product`, `file_type`, `error_type` |

---

## Important Notes

1. **24-48 Hour Delay**: Custom dimensions may take 24-48 hours to appear in standard reports, but DebugView shows them immediately.

2. **Retroactive Data**: Custom definitions only apply to data collected *after* creation. Historical data won't have these dimensions.

3. **Limits**: GA4 allows up to 50 event-scoped custom dimensions and 50 custom metrics per property.

4. **Parameter Names**: The event parameter names are case-sensitive and must match exactly what's in the code.

---

## Checklist

- [ ] Create `product` custom dimension
- [ ] Create `promo_code` custom dimension
- [ ] Create `invite_token` custom dimension
- [ ] Create `method` custom dimension
- [ ] Create `purchase_type` custom dimension
- [ ] Create `comparison_id` custom dimension
- [ ] Create `document_types` custom dimension
- [ ] Create `error_type` custom dimension
- [ ] Create `form_name` custom dimension
- [ ] Create `step_name` custom dimension
- [ ] Create `format` custom dimension
- [ ] Create `source` custom dimension
- [ ] Create `document_count` custom metric
- [ ] Mark `sign_up` as Key Event
- [ ] Mark `purchase` as Key Event
- [ ] Mark `api_key_added` as Key Event
- [ ] Test with DebugView
