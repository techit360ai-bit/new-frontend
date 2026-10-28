import { expect, test } from 'vitest'
import { setAuthTokenGetter } from './client'
import {
  completeCatchUp,
  listRecommendations,
  sendRecommendationFeedback,
} from './discovery'

function response(body: unknown) {
  return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } })
}

function stubFetch(handler: (url: string, init?: RequestInit) => Promise<Response> | Response) {
  const original = globalThis.fetch
  const calls: Array<[string, RequestInit | undefined]> = []
  globalThis.fetch = (async (url, init) => {
    calls.push([String(url), init])
    return handler(String(url), init)
  }) as typeof fetch
  return { calls, restore: () => { globalThis.fetch = original } }
}

test('discovery reads shared BACKEND recommendations with auth and surface filters', async () => {
  setAuthTokenGetter(() => 'jwt-discovery')
  const fetchMock = stubFetch(async () => response({ recommendations: [], meta: { role: 'founder' } }))
  try {
    const result = await listRecommendations({ surface: 'feed', type: 'startup', limit: 6 })
    const [url, init] = fetchMock.calls[0] as [string, RequestInit]
    expect(url).toBe('http://localhost:3000/api/discovery/recommendations?surface=feed&type=startup&limit=6')
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer jwt-discovery')
    expect(result.meta.role).toBe('founder')
  } finally {
    fetchMock.restore()
    setAuthTokenGetter(() => null)
  }
})

test('recommendation feedback and catch-up completion use persisted endpoints', async () => {
  const fetchMock = stubFetch(async () => response({ completed: true, completedAt: '2026-08-17T00:00:00Z' }))
  try {
    await sendRecommendationFeedback('rec_1', 'not_interested')
    await completeCatchUp()
    expect(fetchMock.calls[0][0]).toBe('http://localhost:3000/api/discovery/recommendations/rec_1/feedback')
    expect(fetchMock.calls[0][1]?.method).toBe('POST')
    expect(fetchMock.calls[1][0]).toBe('http://localhost:3000/api/discovery/catch-up/complete')
  } finally {
    fetchMock.restore()
  }
})
