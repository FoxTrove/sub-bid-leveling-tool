import { encrypt, decrypt } from '@/lib/utils/encryption'
import type {
  ProcoreTokens,
  ProcoreMe,
  ProcoreProject,
  ProcoreBidPackage,
  ProcoreBid,
  ProcoreCompany,
} from '@/types/procore'

// Procore API Configuration
const PROCORE_BASE_URL = 'https://api.procore.com'
const PROCORE_AUTH_URL = 'https://login.procore.com/oauth/authorize'
const PROCORE_TOKEN_URL = 'https://login.procore.com/oauth/token'

// Environment variables
function getClientId(): string {
  const clientId = process.env.PROCORE_CLIENT_ID
  if (!clientId) {
    throw new Error('PROCORE_CLIENT_ID environment variable is not set')
  }
  return clientId
}

function getClientSecret(): string {
  const clientSecret = process.env.PROCORE_CLIENT_SECRET
  if (!clientSecret) {
    throw new Error('PROCORE_CLIENT_SECRET environment variable is not set')
  }
  return clientSecret
}

function getRedirectUri(): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (!appUrl) {
    throw new Error('NEXT_PUBLIC_APP_URL environment variable is not set')
  }
  return `${appUrl}/api/procore/auth/callback`
}

// OAuth Utilities
export function getProcoreAuthUrl(state: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: getClientId(),
    redirect_uri: getRedirectUri(),
    state,
  })
  return `${PROCORE_AUTH_URL}?${params.toString()}`
}

export async function exchangeCodeForTokens(code: string): Promise<ProcoreTokens> {
  const response = await fetch(PROCORE_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: getClientId(),
      client_secret: getClientSecret(),
      code,
      redirect_uri: getRedirectUri(),
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error_description || 'Failed to exchange code for tokens')
  }

  return response.json()
}

export async function refreshAccessToken(refreshToken: string): Promise<ProcoreTokens> {
  const response = await fetch(PROCORE_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: getClientId(),
      client_secret: getClientSecret(),
      refresh_token: refreshToken,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error_description || 'Failed to refresh access token')
  }

  return response.json()
}

// Token encryption/decryption utilities
export function encryptTokens(tokens: ProcoreTokens): {
  accessTokenEncrypted: string
  refreshTokenEncrypted: string
  expiresAt: Date
} {
  return {
    accessTokenEncrypted: encrypt(tokens.access_token),
    refreshTokenEncrypted: encrypt(tokens.refresh_token),
    expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
  }
}

export function decryptAccessToken(encrypted: string): string {
  return decrypt(encrypted)
}

export function decryptRefreshToken(encrypted: string): string {
  return decrypt(encrypted)
}

// Procore API Client Class
export class ProcoreClient {
  private accessToken: string
  private companyId: number

  constructor(accessToken: string, companyId: number) {
    this.accessToken = accessToken
    this.companyId = companyId
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${PROCORE_BASE_URL}${endpoint}`

    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        'Procore-Company-Id': this.companyId.toString(),
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorMessage: string
      try {
        const errorJson = JSON.parse(errorText)
        errorMessage = errorJson.message || errorJson.error || errorText
      } catch {
        errorMessage = errorText
      }
      throw new Error(`Procore API error (${response.status}): ${errorMessage}`)
    }

    return response.json()
  }

  // Get current user info
  async getMe(): Promise<ProcoreMe> {
    return this.request<ProcoreMe>('/rest/v1.0/me')
  }

  // Get companies the user has access to
  async getCompanies(): Promise<ProcoreCompany[]> {
    return this.request<ProcoreCompany[]>('/rest/v1.0/companies')
  }

  // Get projects for the company
  async getProjects(options?: {
    page?: number
    perPage?: number
    filters?: {
      active?: boolean
    }
  }): Promise<ProcoreProject[]> {
    const params = new URLSearchParams()
    if (options?.page) params.set('page', options.page.toString())
    if (options?.perPage) params.set('per_page', options.perPage.toString())
    if (options?.filters?.active !== undefined) {
      params.set('filters[active]', options.filters.active.toString())
    }

    const query = params.toString()
    const endpoint = `/rest/v1.0/projects${query ? `?${query}` : ''}`

    return this.request<ProcoreProject[]>(endpoint)
  }

  // Get a single project
  async getProject(projectId: number): Promise<ProcoreProject> {
    return this.request<ProcoreProject>(`/rest/v1.0/projects/${projectId}`)
  }

  // Get bid packages for a project
  async getBidPackages(projectId: number, options?: {
    page?: number
    perPage?: number
  }): Promise<ProcoreBidPackage[]> {
    const params = new URLSearchParams()
    if (options?.page) params.set('page', options.page.toString())
    if (options?.perPage) params.set('per_page', options.perPage.toString())

    const query = params.toString()
    const endpoint = `/rest/v1.0/projects/${projectId}/bid_packages${query ? `?${query}` : ''}`

    return this.request<ProcoreBidPackage[]>(endpoint)
  }

  // Get a single bid package
  async getBidPackage(projectId: number, bidPackageId: number): Promise<ProcoreBidPackage> {
    return this.request<ProcoreBidPackage>(
      `/rest/v1.0/projects/${projectId}/bid_packages/${bidPackageId}`
    )
  }

  // Get bids for a bid package
  async getBids(projectId: number, bidPackageId: number): Promise<ProcoreBid[]> {
    return this.request<ProcoreBid[]>(
      `/rest/v1.0/projects/${projectId}/bid_packages/${bidPackageId}/bids`
    )
  }

  // Get a single bid with attachments
  async getBid(projectId: number, bidPackageId: number, bidId: number): Promise<ProcoreBid> {
    return this.request<ProcoreBid>(
      `/rest/v1.0/projects/${projectId}/bid_packages/${bidPackageId}/bids/${bidId}`
    )
  }

  // Download a file attachment
  async downloadAttachment(url: string): Promise<ArrayBuffer> {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to download attachment: ${response.status}`)
    }

    return response.arrayBuffer()
  }
}

// Helper to create a client from encrypted tokens
export async function createProcoreClient(
  accessTokenEncrypted: string,
  refreshTokenEncrypted: string,
  tokenExpiresAt: Date,
  companyId: string,
  onTokenRefresh?: (newTokens: {
    accessTokenEncrypted: string
    refreshTokenEncrypted: string
    expiresAt: Date
  }) => Promise<void>
): Promise<ProcoreClient> {
  let accessToken = decryptAccessToken(accessTokenEncrypted)

  // Check if token is expired or about to expire (within 5 minutes)
  const expirationBuffer = 5 * 60 * 1000 // 5 minutes in ms
  if (new Date(tokenExpiresAt).getTime() - Date.now() < expirationBuffer) {
    // Refresh the token
    const refreshToken = decryptRefreshToken(refreshTokenEncrypted)
    const newTokens = await refreshAccessToken(refreshToken)
    const encrypted = encryptTokens(newTokens)

    // Notify caller to persist new tokens
    if (onTokenRefresh) {
      await onTokenRefresh(encrypted)
    }

    accessToken = newTokens.access_token
  }

  return new ProcoreClient(accessToken, parseInt(companyId, 10))
}

// Check if Procore integration is configured
export function isProcoreConfigured(): boolean {
  return !!(
    process.env.PROCORE_CLIENT_ID &&
    process.env.PROCORE_CLIENT_SECRET &&
    process.env.NEXT_PUBLIC_APP_URL
  )
}
