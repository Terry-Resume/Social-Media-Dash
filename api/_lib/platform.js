import { requireUser, isDemo } from '@kato8/core/server'
import { ALL_ROLES } from '@kato8/core'
import { DEMO_METRICS } from './demo-metrics.js'

export const METRIC_KEYS = ['followers', 'impressions', 'reach', 'clicks', 'engagement', 'growth']

/** An error a platform fetcher can throw to choose the HTTP status the dashboard sees. */
export class PlatformError extends Error {
  constructor(status, message) { super(message); this.status = status }
}

/**
 * Normalise what a platform API really returned.
 * Anything the API did not give us is `null` and listed in `unavailable`; it is never estimated or
 * filled with a constant. (These endpoints used to invent impressions, reach, clicks, engagement and
 * growth, so the dashboard showed numbers that did not exist.)
 */
export function buildMetrics(platform, values, { source = 'live', extra = {} } = {}) {
  const out = { platform, source }
  const unavailable = []
  for (const key of METRIC_KEYS) {
    const v = values?.[key]
    if (typeof v === 'number' && Number.isFinite(v)) out[key] = v
    else { out[key] = null; unavailable.push(key) }
  }
  return { ...out, ...extra, unavailable }
}

/** Parses an API count that may arrive as a string; returns null when absent or not a number. */
export const count = v => (v == null || v === '' ? null : Number.isFinite(Number(v)) ? Number(v) : null)

const withTimeout = (fetchImpl, ms = 8000) => (url, init = {}) => fetchImpl(url, { signal: AbortSignal.timeout(ms), ...init })

/**
 * Wraps a platform fetcher with the checks every metrics route needs: GET only, a signed-in
 * staff role (fail closed), demo data in demo mode, and generic errors that never leak upstream details.
 *   fetchLive(env, fetchImpl) -> { values, extra? }  or throws PlatformError
 */
export function platformHandler(platform, fetchLive, { fetchImpl = globalThis.fetch, env = () => process.env } = {}) {
  return async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
    if (!(await requireUser(req, res, { roles: ALL_ROLES }))) return
    res.setHeader('Cache-Control', 'private, no-store')
    const e = env()
    if (isDemo(e)) return res.json(buildMetrics(platform, DEMO_METRICS[platform], { source: 'demo' }))
    try {
      const { values, extra } = await fetchLive(e, withTimeout(fetchImpl))
      return res.json(buildMetrics(platform, values, { extra }))
    } catch (err) {
      if (err instanceof PlatformError) return res.status(err.status).json({ error: err.message })
      console.error(`[${platform}]`, err?.name === 'TimeoutError' ? 'upstream timeout' : err?.message)
      return res.status(502).json({ error: 'Upstream request failed' })
    }
  }
}
