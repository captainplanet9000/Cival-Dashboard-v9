/**
 * API URL Builder Utility
 * Handles consistent URL construction for both client and server environments
 */

export function buildApiUrl(path: string, params?: Record<string, string>): string {
  let baseUrl = ''
  
  // Handle different environments
  if (typeof window !== 'undefined') {
    // Client-side: use window.location.origin
    baseUrl = window.location.origin
  } else if (process.env.VERCEL_URL) {
    // Vercel deployment
    baseUrl = `https://${process.env.VERCEL_URL}`
  } else if (process.env.RAILWAY_PUBLIC_DOMAIN) {
    // Railway deployment
    baseUrl = `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
  } else if (process.env.NEXT_PUBLIC_API_URL) {
    // Custom API URL
    baseUrl = process.env.NEXT_PUBLIC_API_URL
  } else {
    // Local development fallback
    baseUrl = 'http://localhost:3000'
  }
  
  // Ensure path starts with /
  if (!path.startsWith('/')) {
    path = '/' + path
  }
  
  // Build the full URL
  const url = new URL(path, baseUrl)
  
  // Add query parameters if provided
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value)
    })
  }
  
  return url.toString()
}

export function buildMarketProxyUrl(provider: string, additionalParams: Record<string, string> = {}): string {
  const params = {
    provider,
    ...additionalParams
  }
  
  return buildApiUrl('/api/market/proxy', params)
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}