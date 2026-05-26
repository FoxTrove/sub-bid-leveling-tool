# BidVet magic-link auth runbook

## Why this matters

If Supabase sends the default PKCE confirmation link, a prospect can authenticate with Supabase but still fail to establish an app session when the link is opened from another browser, profile, email client, or link scanner. In that case the app sees a failed `/auth/callback` request and the user lands back on `/login`.

The app callback supports Supabase's token-hash flow, which does not depend on a browser-stored PKCE verifier and is more reliable for passwordless signup links.

## Supabase Auth settings

In Supabase Dashboard -> Authentication -> URL Configuration:

- Site URL: `https://bidvet.foxtrove.ai`
- Redirect URLs:
  - `https://bidvet.foxtrove.ai/auth/callback`
  - `https://bidvet.foxtrove.ai/auth/callback?*`
  - `http://localhost:3000/auth/callback`
  - `http://localhost:3000/auth/callback?*`

## Supabase email template

In Supabase Dashboard -> Authentication -> Email Templates -> Magic Link, use a token-hash callback URL instead of the default confirmation URL:

```html
<a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email&next={{ .RedirectTo }}">
  Sign in to BidVet
</a>
```

Keep the same pattern for signup/confirmation templates if they are enabled separately.

For password recovery, use:

```html
<a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=recovery">
  Reset your BidVet password
</a>
```

## Production smoke test

1. Open an incognito/private browser.
2. Go to `https://bidvet.foxtrove.ai/login`.
3. Request a magic link for a test email.
4. Open the newest email link.
5. Confirm the app lands on `/onboarding` for a new user or `/dashboard` for an onboarded user.
6. Confirm `/login?error=auth_failed` displays a visible error instead of silently showing the login form.

