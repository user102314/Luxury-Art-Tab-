/** API HTTPS production (VPS via nginx). */
export const PRODUCTION_API_URL = 'https://api.luxury-art.tn/api'

/** Backend Spring local. */
export const LOCAL_API_URL = 'http://localhost:8081/api'

/**
 * Base des appels API.
 * En `npm run dev`, on appelle Spring directement : le chemin `/api` est
 * intercepté par TanStack Start (page HTML 404), le proxy Vite ne s’applique pas.
 */
export function getApiBase(): string {
  if (import.meta.env.DEV) return LOCAL_API_URL
  const fromEnv = (import.meta.env.VITE_API_URL as string | undefined)?.trim()
  if (fromEnv) return fromEnv.replace(/\/$/, '')
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
