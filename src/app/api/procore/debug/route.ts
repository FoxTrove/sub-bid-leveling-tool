import { NextResponse } from "next/server"

// Debug endpoint to check Procore configuration
// Remove this in production
export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  const clientId = process.env.PROCORE_CLIENT_ID
  const hasClientSecret = !!process.env.PROCORE_CLIENT_SECRET

  const redirectUri = appUrl ? `${appUrl}/api/procore/auth/callback` : null

  return NextResponse.json({
    configured: !!(appUrl && clientId && hasClientSecret),
    appUrl,
    redirectUri,
    clientIdSet: !!clientId,
    clientSecretSet: hasClientSecret,
    // Show first few chars of client ID for verification
    clientIdPreview: clientId ? `${clientId.substring(0, 8)}...` : null,
  })
}
