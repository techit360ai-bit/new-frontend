import { getAuthToken } from './client'

const env = typeof import.meta !== 'undefined'
  ? ((import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {})
  : {}
const CORE_API = (env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/$/, '')

export async function fetchTranslations(locale: string): Promise<Record<string, any> | null> {
  try {
    const token = getAuthToken()
    const res = await fetch(`${CORE_API}/translations?locale=${encodeURIComponent(locale)}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      signal: AbortSignal.timeout(3000),
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.translations || data
  } catch {
    return null
  }
}

export async function syncTranslationDictionary(locale: string, dictionary: Record<string, any>): Promise<boolean> {
  try {
    const token = getAuthToken()
    const res = await fetch(`${CORE_API}/translations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ locale, dictionary }),
      signal: AbortSignal.timeout(4000),
    })
    return res.ok
  } catch {
    return false
  }
}
