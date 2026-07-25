import type { SiteSettings } from '@/types/api'

export function digitsOnly(value?: string) {
  return (value ?? '').replace(/\D/g, '')
}

export function formatShopAddress(settings?: Pick<SiteSettings, 'adresse' | 'ville' | 'pays'> | null) {
  if (!settings) return ''
  const adresse = settings.adresse?.trim()
  if (adresse) return adresse
  return [settings.ville, settings.pays]
    .map((p) => p?.trim())
    .filter(Boolean)
    .join(', ')
}

export function whatsappHref(number?: string, message?: string) {
  const digits = digitsOnly(number)
  if (!digits) return undefined
  const q = message ? `?text=${encodeURIComponent(message)}` : ''
  return `https://wa.me/${digits}${q}`
}

export function hasDefinedTerms(settings?: Pick<SiteSettings, 'termsContent'> | null) {
  return Boolean(settings?.termsContent?.trim())
}
