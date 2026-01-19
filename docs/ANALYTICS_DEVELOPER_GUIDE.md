# Analytics Implementation Guide for Foxtrove Products

This guide explains how to implement consistent GA4 tracking across all Foxtrove products (main site, BidLevel, future products).

## Overview

We use a **unified event naming convention** with a `product` parameter to differentiate events across products. This allows us to:
- See aggregate metrics across all products
- Filter by specific product when needed
- Compare performance between products

**GA4 Measurement ID:** `G-QFQBLZHJN7` (same ID for all products)

---

## Core Principle

**Same event name + different `product` parameter**

```javascript
// BidLevel signup
gtag('event', 'sign_up', {
  product: 'bidlevel',
  method: 'magic_link'
});

// Main site signup
gtag('event', 'sign_up', {
  product: 'foxtrove_main',
  method: 'email'
});
```

This way, in GA4 you can:
- See **all signups** by looking at the `sign_up` event
- See **only BidLevel signups** by filtering `product = bidlevel`

---

## Standard Event Names

Use these exact event names across all products:

### Authentication Events
| Event Name | When to Fire | Required Parameters |
|------------|--------------|---------------------|
| `sign_up` | User creates new account | `product`, `method` |
| `login` | User logs in | `product`, `method` |
| `logout` | User logs out | `product` |

### Engagement Events
| Event Name | When to Fire | Required Parameters |
|------------|--------------|---------------------|
| `page_view` | Page load (automatic) | `product` |
| `pricing_page_viewed` | User views pricing | `product`, `source` (optional) |
| `feature_used` | User uses a feature | `product`, `feature_name` |
| `help_clicked` | User clicks help | `product` |

### Conversion Events
| Event Name | When to Fire | Required Parameters |
|------------|--------------|---------------------|
| `checkout_started` | User begins checkout | `product`, `value`, `currency`, `items` |
| `purchase` | Purchase completed | `product`, `value`, `currency`, `transaction_id`, `purchase_type` |
| `subscription_started` | New subscription | `product`, `plan_name`, `value`, `currency` |
| `subscription_cancelled` | Subscription cancelled | `product`, `plan_name` |

### Product-Specific Events
Products can have their own events, but still include `product` parameter:

**BidLevel-specific:**
- `invite_link_viewed`
- `comparison_started`
- `comparison_completed`
- `api_key_added`
- `documents_uploaded`

---

## Product Identifiers

Use these exact values for the `product` parameter:

| Product | `product` value |
|---------|-----------------|
| Main Foxtrove site | `foxtrove_main` |
| BidLevel | `bidlevel` |
| Future Product X | `product_x` |

---

## Implementation Examples

### JavaScript (Vanilla)

```html
<!-- Add GA4 script in <head> -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-QFQBLZHJN7"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-QFQBLZHJN7', {
    cookie_domain: 'auto',
    linker: {
      domains: ['foxtrove.ai', 'bidlevel.foxtrove.ai']
    }
  });
</script>
```

```javascript
// Track signup
function trackSignUp(method) {
  gtag('event', 'sign_up', {
    product: 'foxtrove_main',
    method: method // 'email', 'google', 'magic_link', etc.
  });
}

// Track purchase
function trackPurchase(transactionId, value, purchaseType) {
  gtag('event', 'purchase', {
    product: 'foxtrove_main',
    transaction_id: transactionId,
    value: value,
    currency: 'USD',
    purchase_type: purchaseType // 'subscription', 'one_time', 'credits'
  });
}

// Track pricing page view
function trackPricingView(source) {
  gtag('event', 'pricing_page_viewed', {
    product: 'foxtrove_main',
    source: source // 'header_nav', 'homepage_cta', 'email_link', etc.
  });
}
```

### React

```typescript
// lib/analytics.ts
const PRODUCT_ID = 'foxtrove_main';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackEvent(eventName: string, params?: Record<string, unknown>) {
  if (typeof window.gtag !== 'function') return;

  window.gtag('event', eventName, {
    product: PRODUCT_ID,
    ...params,
  });
}

export function trackSignUp(method: string) {
  trackEvent('sign_up', { method });
}

export function trackPurchase(params: {
  transactionId: string;
  value: number;
  purchaseType: string;
}) {
  trackEvent('purchase', {
    transaction_id: params.transactionId,
    value: params.value,
    currency: 'USD',
    purchase_type: params.purchaseType,
  });
}
```

### Next.js

See `src/lib/analytics/` in the BidLevel repo for a complete Next.js implementation with:
- GA script component
- Typed event functions
- Automatic page view tracking

---

## Purchase Type Values

For the `purchase_type` parameter, use consistent values:

| Value | Description |
|-------|-------------|
| `subscription_monthly` | Monthly recurring subscription |
| `subscription_annual` | Annual recurring subscription |
| `credits` | Credit pack purchase |
| `one_time` | One-time purchase |

---

## Method Values (for sign_up/login)

| Value | Description |
|-------|-------------|
| `email` | Email/password |
| `magic_link` | Passwordless email link |
| `google` | Google OAuth |
| `github` | GitHub OAuth |

---

## Testing Your Implementation

1. Open your site
2. Open browser DevTools > Console
3. Run: `window.gtag` (should return a function)
4. Trigger an event on your site
5. Check GA4 > Reports > Realtime

### Debug Mode

Add this to enable verbose console logging:

```javascript
gtag('config', 'G-QFQBLZHJN7', { debug_mode: true });
```

Or install the [GA4 Debugger Chrome extension](https://chrome.google.com/webstore/detail/google-analytics-debugger/jnkmfdileelhofjcijamephohjechhna).

---

## Checklist for Implementation

- [ ] Add GA4 script to all pages
- [ ] Set `cookie_domain: 'auto'` for subdomain tracking
- [ ] Add `linker.domains` array with all your domains
- [ ] Use `NEXT_PUBLIC_GA_MEASUREMENT_ID` env var (or equivalent)
- [ ] Include `product` parameter on ALL events
- [ ] Use standard event names from this guide
- [ ] Test in Realtime report before deploying

---

## Questions?

Contact Kyle or check the BidLevel analytics implementation in:
- `src/lib/analytics/index.ts` - Event definitions
- `src/lib/analytics/google-analytics.tsx` - GA4 script setup

---

## Quick Reference

```javascript
// Always include product parameter
gtag('event', 'EVENT_NAME', {
  product: 'your_product_id',  // REQUIRED
  // ... other parameters
});
```

**Measurement ID:** `G-QFQBLZHJN7`

**Products:** `foxtrove_main`, `bidlevel`
