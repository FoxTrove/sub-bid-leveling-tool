# Google Analytics Setup Guide for BidLevel

This guide walks you through setting up Google Analytics 4 (GA4) for tracking both your main domain (foxtrove.ai) and subdomain (bidlevel.foxtrove.ai).

## Table of Contents

1. [Understanding the Setup](#understanding-the-setup)
2. [Step 1: Verify Your GA4 Property](#step-1-verify-your-ga4-property)
3. [Step 2: Configure Cross-Domain Tracking](#step-2-configure-cross-domain-tracking)
4. [Step 3: Add Environment Variable to Vercel](#step-3-add-environment-variable-to-vercel)
5. [Step 4: Verify Tracking is Working](#step-4-verify-tracking-is-working)
6. [Understanding Events](#understanding-events)
7. [Troubleshooting](#troubleshooting)

---

## Understanding the Setup

### Do I Need a New Stream?

**No.** For subdomains, you should use:
- **ONE GA4 Property** (e.g., "Foxtrove")
- **ONE Web Data Stream** (your main domain)

GA4 automatically tracks subdomains as part of the same property. The key is configuring **cross-domain tracking** so users moving between foxtrove.ai and bidlevel.foxtrove.ai are recognized as the same session.

### What's Already Configured in Code

The BidLevel app includes GA4 tracking code that:
- Loads the GA4 script with your Measurement ID
- Sets `cookie_domain: 'auto'` (handles subdomains automatically)
- Configures linker for cross-domain tracking
- Tracks page views on client-side navigation
- Sends custom events (signups, API key added, etc.)

---

## Step 1: Verify Your GA4 Property

1. Go to [Google Analytics](https://analytics.google.com/)
2. Select your property (or create one if you haven't)
3. Go to **Admin** (gear icon, bottom left)
4. Under **Property**, click **Data Streams**

You should see a web stream. If not, create one:

### Creating a Web Stream (if needed)

1. Click **Add stream** > **Web**
2. Enter your website URL: `https://foxtrove.ai`
3. Enter a stream name: `Foxtrove Web`
4. Click **Create stream**
5. Copy the **Measurement ID** (format: `G-XXXXXXXXXX`)

Your Measurement ID is: `G-QFQBLZHJN7`

---

## Step 2: Configure Cross-Domain Tracking

This ensures users visiting foxtrove.ai and then bidlevel.foxtrove.ai are tracked as the same session.

### Navigate to Tag Settings

1. Go to **Admin** > **Data Streams**
2. Click on your web stream (e.g., `Foxtrove Web`)
3. Scroll down to **Google tag** section
4. Click **Configure tag settings**

### Configure Your Domains

1. In the Settings section, click **Configure your domains**
2. Under **Match conditions**, add your domains:

   | Match Type | Domain |
   |------------|--------|
   | Contains | `foxtrove.ai` |

   This single rule covers both:
   - `foxtrove.ai` (main site)
   - `bidlevel.foxtrove.ai` (subdomain)

3. Click **Save**

### Why "Contains" Works

Using "Contains" with `foxtrove.ai` matches:
- `foxtrove.ai`
- `www.foxtrove.ai`
- `bidlevel.foxtrove.ai`
- `app.foxtrove.ai`
- Any other subdomain

This is the simplest and most flexible approach.

---

## Step 3: Add Environment Variable to Vercel

The GA4 tracking code needs the Measurement ID to function.

### Add to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your **sub-bid-leveling-tool** project
3. Go to **Settings** > **Environment Variables**
4. Add a new variable:

   | Key | Value |
   |-----|-------|
   | `NEXT_PUBLIC_GA_MEASUREMENT_ID` | `G-QFQBLZHJN7` |

5. Select environments: **Production**, **Preview**, **Development**
6. Click **Save**
7. **Redeploy** your project for the change to take effect:
   - Go to **Deployments**
   - Click the three dots on the latest deployment
   - Click **Redeploy**

### Local Development

The `.env` file already has this variable set:

```
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-QFQBLZHJN7
```

---

## Step 4: Verify Tracking is Working

### Method 1: Real-Time Report

1. Open your site in a browser: `https://bidlevel.foxtrove.ai`
2. In GA4, go to **Reports** > **Realtime**
3. You should see your visit appear within seconds

### Method 2: Browser Developer Tools

1. Open your site
2. Open DevTools (F12 or Cmd+Option+I)
3. Go to **Network** tab
4. Filter by `google` or `gtag`
5. You should see requests to `google-analytics.com`

### Method 3: GA4 DebugView

1. Install the [Google Analytics Debugger](https://chrome.google.com/webstore/detail/google-analytics-debugger/jnkmfdileelhofjcijamephohjechhna) Chrome extension
2. Enable it (click the icon)
3. Visit your site
4. In GA4, go to **Admin** > **DebugView**
5. You'll see events streaming in real-time with full details

---

## Understanding Events

### Automatic Events

GA4 automatically tracks these (no code needed):
- `page_view` - Every page load
- `session_start` - New sessions
- `first_visit` - First-time visitors
- `scroll` - 90% page scroll
- `click` - Outbound link clicks

### Custom Events We Track

| Event Name | When It Fires | Parameters |
|------------|---------------|------------|
| `invite_link_viewed` | User visits `/join?invite=TOKEN` | `invite_token`, `promo_code` |
| `sign_up` | User completes onboarding | `method`, `promo_code` |
| `onboarding_completed` | Profile setup finished | `promo_code` |
| `api_key_added` | User adds OpenAI API key | - |
| `api_key_removed` | User removes API key | - |
| `pricing_page_viewed` | User views pricing page | `source` |
| `comparison_started` | User starts a comparison | `document_count` |
| `comparison_completed` | Analysis finishes | `comparison_id` |
| `purchase` | User completes purchase | `value`, `currency`, `transaction_id` |

### Viewing Events in GA4

1. Go to **Reports** > **Engagement** > **Events**
2. You'll see all events with counts
3. Click an event to see parameters and user details

---

## Setting Up Conversions

Mark important events as conversions to track them prominently:

1. Go to **Admin** > **Events**
2. Find your key events (e.g., `sign_up`, `purchase`)
3. Toggle the **Mark as conversion** switch

Recommended conversions:
- `sign_up` - New user signups
- `purchase` - Completed purchases
- `api_key_added` - Users who added their API key (HANDSHAKE success)
- `comparison_completed` - Users who got value from the product

---

## Creating Custom Reports

### Funnel: Invite to Signup

Track how many invite link visitors convert to signups:

1. Go to **Explore** > **Create new exploration**
2. Choose **Funnel exploration**
3. Add steps:
   - Step 1: `invite_link_viewed`
   - Step 2: `sign_up`
4. Save and analyze drop-off

### Segment: HANDSHAKE Users

Create a segment for users who signed up via HANDSHAKE:

1. Go to **Admin** > **Audiences** > **New audience**
2. Create custom audience
3. Add condition: Event `sign_up` where `promo_code` equals `HANDSHAKE`
4. Name it "HANDSHAKE Users"
5. Save

---

## Troubleshooting

### Events Not Showing Up

1. **Check Measurement ID**: Ensure `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set correctly
2. **Check Vercel deployment**: Make sure you redeployed after adding the env var
3. **Wait a few minutes**: GA4 can have delays up to 24-48 hours for some reports
4. **Use Realtime**: The Realtime report shows data immediately

### Cross-Domain Not Working

If users aren't being tracked across domains:

1. Verify the "Configure your domains" setting includes `foxtrove.ai`
2. Check that both sites have the same Measurement ID
3. Clear cookies and test again

### Console Errors

If you see errors in browser console:

```
gtag is not defined
```

The GA script may not have loaded. Check:
- Ad blockers (disable temporarily)
- Network tab for blocked requests
- Measurement ID is correct

### Data Discrepancies

GA4 data may differ from server logs because:
- Ad blockers prevent tracking (~10-30% of users)
- Bots are filtered out
- Sampling occurs on large datasets

---

## Quick Reference

| Item | Value |
|------|-------|
| Measurement ID | `G-QFQBLZHJN7` |
| Environment Variable | `NEXT_PUBLIC_GA_MEASUREMENT_ID` |
| Main Domain | `foxtrove.ai` |
| Subdomain | `bidlevel.foxtrove.ai` |
| Analytics Library | `src/lib/analytics/index.ts` |
| GA Component | `src/lib/analytics/google-analytics.tsx` |

---

## Adding New Events

To track a new event:

```typescript
import { trackEvent } from '@/lib/analytics'

// Simple event
trackEvent('button_clicked')

// Event with parameters
trackEvent('feature_used', {
  feature_name: 'export_pdf',
  document_count: 3
})
```

Or add a convenience function in `src/lib/analytics/index.ts`:

```typescript
export function trackFeatureUsed(featureName: string, params?: Record<string, unknown>) {
  trackEvent('feature_used', {
    feature_name: featureName,
    ...params
  })
}
```

---

## Next Steps

1. [ ] Verify real-time tracking works
2. [ ] Mark key events as conversions
3. [ ] Set up the invite-to-signup funnel
4. [ ] Create HANDSHAKE users audience
5. [ ] Share the invite link and monitor!

Your invite links:
- `https://bidlevel.foxtrove.ai/join?invite=HANDSHAKE2026`
- `https://bidlevel.foxtrove.ai/join?invite=GC-PARTNER`
