/** API HTTPS production (VPS via nginx). */
export const PRODUCTION_API_URL = 'https://api.luxury-art.tn/api'

/**
 * Base des appels API.
 * - VITE_API_URL si défini (local / Vercel)
 * - en DEV sans env : proxy Vite `/api`
 * - en PROD sans env : API HTTPS (évite les 404 sur luxury-art.tn/api)
 */
export function getApiBase(): string {
  const fromEnv = (import.meta.env.VITE_API_URL as string | undefined)?.trim()
  if (fromEnv) return fromEnv.replace(/\/$/, '')
  if (import.meta.env.DEV) return '/api'
  return PRODUCTION_API_URL
}

/** Origine du backend (scheme + host + port) pour /uploads et WebSocket. */
export function getApiOrigin(): string | undefined {
  const base = getApiBase()
  if (!/^https?:\/\//i.test(base)) return undefined
  try {
    return new URL(base).origin
  } catch {
    return undefined
  }
}
