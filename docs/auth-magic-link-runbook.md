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

In Supabase Dashboard -> Authentication -> Email Templates -> Magic Link, use a token-hash callback URL instead of the default confirmation URL.

The button must use a solid background color, not a CSS gradient. Outlook can drop gradients on links, which leaves white button text on a white background. Include the raw URL and the one-time code so prospects can still sign in if their email client hides or rewrites the button.

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden;">
          <tr>
            <td align="center" style="padding: 40px 40px 30px 40px;">
              <img src="https://bidvet.foxtrove.ai/bidvet-logo.png" alt="BidVet" width="160" height="45" style="display: block; border: 0;">
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 40px 40px;">
              <h1 style="margin: 0 0 20px 0; font-size: 24px; font-weight: 600; color: #18181b; text-align: center;">Sign in to BidVet</h1>
              <p style="margin: 0 0 30px 0; font-size: 16px; line-height: 24px; color: #52525b; text-align: center;">
                Click the button below to securely sign in to your account. This link will expire in 24 hours.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&amp;type=magiclink&amp;next={{ .RedirectTo }}" style="display: inline-block; padding: 14px 32px; background-color: #0f766e; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px;">
                      Sign in to BidVet
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 28px 0 8px 0; font-size: 14px; line-height: 20px; color: #52525b; text-align: center;">
                If the button is hidden, copy and paste this link into your browser:
              </p>
              <p style="margin: 0; font-size: 13px; line-height: 20px; color: #0f766e; text-align: center; word-break: break-all;">
                {{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&amp;type=magiclink&amp;next={{ .RedirectTo }}
              </p>
              <p style="margin: 28px 0 8px 0; font-size: 14px; line-height: 20px; color: #52525b; text-align: center;">
                Or enter this one-time code on the BidVet sign-in page:
              </p>
              <p style="margin: 0; font-size: 28px; line-height: 36px; color: #18181b; text-align: center; font-weight: 700; letter-spacing: 0;">
                {{ .Token }}
              </p>
              <p style="margin: 30px 0 0 0; font-size: 14px; line-height: 20px; color: #71717a; text-align: center;">
                If you requested more than one sign-in email, use the newest one.
              </p>
              <p style="margin: 12px 0 0 0; font-size: 14px; line-height: 20px; color: #71717a; text-align: center;">
                If you didn't request this email, you can safely ignore it.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px; background-color: #fafafa; border-top: 1px solid #e4e4e7;">
              <p style="margin: 0; font-size: 12px; color: #71717a; text-align: center;">
                BidVet by Foxtrove.ai
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

Keep the same token-hash pattern for signup/confirmation templates if they are enabled separately.

For password recovery, use:

```html
<a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&amp;type=recovery">
  Reset your BidVet password
</a>
```

## Production smoke test

1. Open an incognito/private browser.
2. Go to `https://bidvet.foxtrove.ai/login`.
3. Request a magic link for a test email.
4. Open the newest email link.
5. Confirm the app lands on `/onboarding` for a new user or `/dashboard` for an onboarded user.
6. Request another email and confirm the one-time code signs in from the "Check your email" screen.
7. Confirm `/login?error=auth_failed` displays a visible error instead of silently showing the login form.
