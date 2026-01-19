# BidLevel Analytics Implementation Guide

This document provides instructions for implementing analytics on the BidLevel subdomain (bidlevel.foxtrove.ai) to harmonize with the Foxtrove unified analytics approach.

---

## Overview

We use a **unified GA4 property** across all Foxtrove products. This allows us to:
- Track user journeys across domains
- Compare performance across products
- Maintain consistent event naming and parameters

### Key Identifiers

| Property | Value |
|----------|-------|
| GA4 Measurement ID | `G-QFQBLZHJN7` |
| Product ID for BidLevel | `bidlevel` |
| Main domain | `foxtrove.ai` |
| BidLevel subdomain | `bidlevel.foxtrove.ai` |

---

## 1. GA4 Script Setup

Add this to your root layout or `<head>`:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-QFQBLZHJN7"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-QFQBLZHJN7', {
    cookie_domain: 'auto',
    linker: {
      domains: ['foxtrove.ai', 'bidlevel.foxtrove.ai']
    },
    send_page_view: true
  });
</script>
```

### For Next.js / React

```tsx
// src/components/analytics/GoogleAnalytics.tsx
'use client';

import Script from 'next/script';

const GA_MEASUREMENT_ID = 'G-QFQBLZHJN7';

export function GoogleAnalytics() {
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}', {
            cookie_domain: 'auto',
            linker: {
              domains: ['foxtrove.ai', 'bidlevel.foxtrove.ai']
            },
            send_page_view: true
          });
        `}
      </Script>
    </>
  );
}
```

Add to your root layout:

```tsx
// src/app/layout.tsx
import { GoogleAnalytics } from '@/components/analytics/GoogleAnalytics';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <GoogleAnalytics />
        {children}
      </body>
    </html>
  );
}
```

---

## 2. Analytics Utility

Create this utility file for consistent event tracking:

```typescript
// src/lib/analytics.ts

/**
 * Analytics Implementation for BidLevel
 *
 * All events automatically include product: 'bidlevel'
 * This harmonizes with the Foxtrove unified analytics approach.
 */

export type ProductId = 'foxtrove_main' | 'bidlevel';

// IMPORTANT: Set this to 'bidlevel' for the BidLevel subdomain
const PRODUCT_ID: ProductId = 'bidlevel';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

/**
 * Core event tracking function
 * Automatically adds product identifier to all events
 */
export function trackEvent(
  eventName: string,
  params?: Record<string, unknown>
): void {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') {
    // Log in development for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics]', eventName, { product: PRODUCT_ID, ...params });
    }
    return;
  }

  window.gtag('event', eventName, {
    product: PRODUCT_ID,
    ...params,
  });
}

// ============================================
// PAGE VIEW EVENTS
// ============================================

/**
 * Track page views with context
 * Call on page mount/route change
 */
export function trackPageView(pageName: string, pageCategory?: string): void {
  trackEvent('page_view_custom', {
    page_name: pageName,
    page_category: pageCategory,
  });
}

// ============================================
// MODAL EVENTS
// ============================================

/**
 * Track when a modal opens
 */
export function trackModalOpen(
  modalType: string,
  source?: string
): void {
  trackEvent('modal_open', {
    modal_type: modalType,
    source: source,
  });
}

/**
 * Track when a modal closes (especially without completion)
 */
export function trackModalClose(
  modalType: string,
  stepReached: number,
  totalSteps: number,
  completed: boolean = false
): void {
  trackEvent('modal_close', {
    modal_type: modalType,
    step_reached: stepReached,
    total_steps: totalSteps,
    completed: completed,
  });
}

// ============================================
// FORM EVENTS
// ============================================

/**
 * Track form step progression
 * Fire each time user advances to a new step
 */
export function trackFormStep(
  formName: string,
  stepNumber: number,
  stepName: string,
  totalSteps: number
): void {
  trackEvent('form_step', {
    form_name: formName,
    step_number: stepNumber,
    step_name: stepName,
    total_steps: totalSteps,
  });
}

/**
 * Track form field interactions (optional, for detailed analysis)
 */
export function trackFormFieldInteraction(
  formName: string,
  fieldName: string,
  interactionType: 'focus' | 'blur' | 'change'
): void {
  trackEvent('form_field_interaction', {
    form_name: formName,
    field_name: fieldName,
    interaction_type: interactionType,
  });
}

// ============================================
// LEAD / CONVERSION EVENTS
// ============================================

/**
 * Track lead form submissions
 * This is a KEY EVENT (conversion)
 */
export function trackLeadSubmit(params: {
  formName: string;
  leadType?: string;
  value?: number;
}): void {
  trackEvent('lead_submit', {
    form_name: params.formName,
    lead_type: params.leadType,
    value: params.value,
  });
}

/**
 * Track qualification results (if applicable)
 */
export function trackQualificationResult(params: {
  qualified: boolean;
  reason?: string;
  score?: number;
}): void {
  trackEvent('qualification_result', {
    qualified: params.qualified,
    qualification_reason: params.reason,
    qualification_score: params.score,
  });
}

/**
 * Track meeting/demo scheduled
 * This is a KEY EVENT (conversion)
 */
export function trackMeetingScheduled(params: {
  meetingType: string;
  source?: string;
}): void {
  trackEvent('meeting_scheduled', {
    meeting_type: params.meetingType,
    source: params.source,
  });
}

// ============================================
// CALCULATOR / TOOL EVENTS
// ============================================

/**
 * Track calculator or tool usage
 */
export function trackCalculatorUse(params: {
  calculatorType: string;
  inputValues?: Record<string, unknown>;
  resultValue?: number;
}): void {
  trackEvent('calculator_use', {
    calculator_type: params.calculatorType,
    result_value: params.resultValue,
    ...params.inputValues,
  });
}

// ============================================
// E-COMMERCE EVENTS
// ============================================

/**
 * Track checkout initiation
 */
export function trackCheckoutStart(params: {
  itemName: string;
  value: number;
  currency?: string;
}): void {
  trackEvent('begin_checkout', {
    item_name: params.itemName,
    value: params.value,
    currency: params.currency || 'USD',
  });
}

/**
 * Track completed purchase
 * This is a KEY EVENT (conversion)
 */
export function trackPurchase(params: {
  transactionId: string;
  value: number;
  currency?: string;
  itemName: string;
}): void {
  trackEvent('purchase', {
    transaction_id: params.transactionId,
    value: params.value,
    currency: params.currency || 'USD',
    item_name: params.itemName,
  });
}

// ============================================
// ERROR EVENTS
// ============================================

/**
 * Track form submission errors
 */
export function trackSubmissionError(params: {
  formName: string;
  errorType: string;
  errorMessage?: string;
}): void {
  trackEvent('submission_error', {
    form_name: params.formName,
    error_type: params.errorType,
    error_message: params.errorMessage,
  });
}

// ============================================
// ENGAGEMENT EVENTS
// ============================================

/**
 * Track CTA button clicks
 */
export function trackCtaClick(
  ctaName: string,
  ctaLocation: string,
  destination?: string
): void {
  trackEvent('cta_click', {
    cta_name: ctaName,
    cta_location: ctaLocation,
    destination: destination,
  });
}

/**
 * Track file downloads
 */
export function trackDownload(
  fileName: string,
  fileType: string
): void {
  trackEvent('file_download', {
    file_name: fileName,
    file_type: fileType,
  });
}

/**
 * Track video engagement
 */
export function trackVideoEngagement(
  videoName: string,
  action: 'play' | 'pause' | 'complete' | 'progress',
  percentWatched?: number
): void {
  trackEvent('video_engagement', {
    video_name: videoName,
    video_action: action,
    percent_watched: percentWatched,
  });
}
```

---

## 3. Event Reference

### Required Events

These events MUST be implemented for analytics parity:

| Event Name | When to Fire | Key Parameters |
|------------|--------------|----------------|
| `modal_open` | User opens any modal | `modal_type`, `source` |
| `modal_close` | User closes modal | `modal_type`, `step_reached`, `total_steps`, `completed` |
| `form_step` | User advances to each form step | `form_name`, `step_number`, `step_name`, `total_steps` |
| `lead_submit` | Lead form successfully submitted | `form_name`, `lead_type`, `value` |
| `submission_error` | Form submission fails | `form_name`, `error_type`, `error_message` |

### Recommended Events

| Event Name | When to Fire | Key Parameters |
|------------|--------------|----------------|
| `page_view_custom` | Page loads (beyond auto pageview) | `page_name`, `page_category` |
| `calculator_use` | User completes a calculation | `calculator_type`, `result_value` |
| `cta_click` | User clicks important CTA | `cta_name`, `cta_location` |
| `meeting_scheduled` | User books a meeting/demo | `meeting_type`, `source` |
| `qualification_result` | Lead qualification completed | `qualified`, `qualification_reason` |
| `begin_checkout` | User starts checkout | `item_name`, `value` |
| `purchase` | Purchase completed | `transaction_id`, `value`, `item_name` |

---

## 4. Implementation Examples

### Modal with Multi-Step Form

```tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import {
  trackModalOpen,
  trackModalClose,
  trackFormStep,
  trackLeadSubmit,
  trackSubmissionError,
} from '@/lib/analytics';

interface MyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MyModal({ isOpen, onClose }: MyModalProps) {
  const [step, setStep] = useState(1);
  const totalSteps = 4;
  const stepNames = ['contact', 'details', 'requirements', 'confirm'];

  const hasTrackedOpen = useRef(false);
  const previousStep = useRef(1);

  // Track modal open and first step
  useEffect(() => {
    if (isOpen && !hasTrackedOpen.current) {
      trackModalOpen('bidlevel_inquiry', 'pricing_page_cta');
      trackFormStep('bidlevel_form', 1, stepNames[0], totalSteps);
      hasTrackedOpen.current = true;
      previousStep.current = 1;
    }
    if (!isOpen) {
      hasTrackedOpen.current = false;
      previousStep.current = 1;
    }
  }, [isOpen]);

  // Track step progression (steps 2+)
  useEffect(() => {
    if (isOpen && step > 1 && step !== previousStep.current) {
      trackFormStep('bidlevel_form', step, stepNames[step - 1], totalSteps);
      previousStep.current = step;
    }
  }, [step, isOpen]);

  const handleClose = () => {
    // Track close if not completed
    if (step < totalSteps) {
      trackModalClose('bidlevel_inquiry', step, totalSteps, false);
    }
    setStep(1);
    onClose();
  };

  const handleSubmit = async (formData: FormData) => {
    try {
      const response = await fetch('/api/submit', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Submission failed');

      // Track successful submission
      trackLeadSubmit({
        formName: 'bidlevel_form',
        leadType: 'demo_request',
        value: 500, // estimated lead value
      });

      // Track modal close as completed
      trackModalClose('bidlevel_inquiry', totalSteps, totalSteps, true);

      onClose();
    } catch (error) {
      trackSubmissionError({
        formName: 'bidlevel_form',
        errorType: 'api_error',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  const nextStep = () => setStep((s) => Math.min(s + 1, totalSteps));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  if (!isOpen) return null;

  return (
    <div className="modal">
      {/* Modal content with steps */}
      <button onClick={handleClose}>Close</button>
      <button onClick={prevStep} disabled={step === 1}>Back</button>
      <button onClick={nextStep} disabled={step === totalSteps}>Next</button>
      {step === totalSteps && (
        <button onClick={() => handleSubmit(new FormData())}>Submit</button>
      )}
    </div>
  );
}
```

### CTA Button Tracking

```tsx
import { trackCtaClick } from '@/lib/analytics';

export function PricingCTA() {
  const handleClick = () => {
    trackCtaClick('get_started', 'pricing_section', '/signup');
    // Navigate or open modal
  };

  return (
    <button onClick={handleClick}>
      Get Started
    </button>
  );
}
```

### Calculator Tool Tracking

```tsx
import { trackCalculatorUse } from '@/lib/analytics';

export function BidCalculator() {
  const [result, setResult] = useState<number | null>(null);

  const calculateBid = (projectSize: number, complexity: string) => {
    const calculatedValue = /* your calculation */;
    setResult(calculatedValue);

    trackCalculatorUse({
      calculatorType: 'bid_estimator',
      inputValues: {
        project_size: projectSize,
        complexity: complexity,
      },
      resultValue: calculatedValue,
    });
  };

  return (
    // Calculator UI
  );
}
```

---

## 5. Parameter Reference

### Universal Parameters (Auto-Added)

These are automatically included with every event:

| Parameter | Value | Description |
|-----------|-------|-------------|
| `product` | `bidlevel` | Identifies events from BidLevel |

### Custom Dimensions (Already Set Up in GA4)

| Parameter | Dimension Name | Scope | Description |
|-----------|----------------|-------|-------------|
| `product` | Product | Event | Product identifier (bidlevel, foxtrove_main) |
| `vertical` | Vertical | Event | Business vertical (use if applicable) |
| `form_name` | Form Name | Event | Name of form being tracked |
| `step_name` | Step Name | Event | Human-readable step name |
| `step_number` | Step Number | Event | Numeric step (1, 2, 3...) |
| `modal_type` | Modal Type | Event | Type of modal opened |
| `lead_type` | Lead Type | Event | Classification of lead |
| `error_type` | Error Type | Event | Category of error |
| `calculator_type` | Calculator Type | Event | Type of calculator used |

### Custom Metrics (Already Set Up in GA4)

| Parameter | Metric Name | Description |
|-----------|-------------|-------------|
| `value` | Value | Monetary value (lead value, purchase amount) |
| `step_reached` | Step Reached | Last step before modal close |
| `total_steps` | Total Steps | Total steps in form |
| `result_value` | Result Value | Calculator output value |

---

## 6. Testing Your Implementation

### Development Console Logging

In development mode, all events are logged to the console:

```
[Analytics] modal_open { product: 'bidlevel', modal_type: 'bidlevel_inquiry', source: 'pricing_cta' }
[Analytics] form_step { product: 'bidlevel', form_name: 'bidlevel_form', step_number: 1, step_name: 'contact', total_steps: 4 }
```

### GA4 DebugView

1. Install [Google Analytics Debugger](https://chrome.google.com/webstore/detail/google-analytics-debugger/jnkmfdileelhofjcijamephohjechhna) Chrome extension
2. Enable the extension
3. Go to GA4 → Admin → DebugView
4. Perform actions on your site
5. Watch events appear in real-time with all parameters

### Event Trigger Test Code

Run this in the browser console to fire test events:

```javascript
// Test all BidLevel events
gtag('event', 'modal_open', { product: 'bidlevel', modal_type: 'test_modal', source: 'test' });
gtag('event', 'form_step', { product: 'bidlevel', form_name: 'test_form', step_number: 1, step_name: 'test_step', total_steps: 3 });
gtag('event', 'lead_submit', { product: 'bidlevel', form_name: 'test_form', lead_type: 'test', value: 100 });
gtag('event', 'modal_close', { product: 'bidlevel', modal_type: 'test_modal', step_reached: 2, total_steps: 3, completed: false });

console.log('BidLevel test events fired - check GA4 DebugView');
```

---

## 7. Key Events (Conversions)

These events are marked as Key Events in GA4. Ensure they fire correctly:

| Event | When | Priority |
|-------|------|----------|
| `lead_submit` | Form submission successful | High |
| `meeting_scheduled` | Demo/meeting booked | High |
| `purchase` | Payment completed | High |
| `qualification_result` (qualified=true) | Lead qualified | Medium |

---

## 8. Checklist

Before launching, verify:

- [ ] GA4 script loads on all pages
- [ ] `product: 'bidlevel'` appears in all events
- [ ] Modal open/close events fire correctly
- [ ] Form step events fire for each step (including step 1)
- [ ] Lead submit fires on successful submission
- [ ] Error events fire on failures
- [ ] Events appear in GA4 DebugView with correct parameters
- [ ] Cross-domain tracking works (test navigation to/from foxtrove.ai)

---

## Questions?

Contact the Foxtrove analytics team if you have questions about:
- Event naming conventions
- New event types not covered here
- GA4 configuration
- Cross-domain tracking issues
