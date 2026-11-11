import { test, beforeEach, after } from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { buildMetrics, platformHandler, PlatformError, METRIC_KEYS } from '../api/_lib/platform.js'
import { fetchYoutube } from '../api/youtube.js'
import { fetchTwitter } from '../api/twitter.js'
import { fetchInstagram } from '../api/instagram.js'
import { fetchLinkedin } from '../api/linkedin.js'
import { fetchTiktok } from '../api/tiktok.js'
import { fetchBluesky } from '../api/bluesky.js'
import aiHandler from '../api/ai.js'

const mkRes = () => {
  const r = { code: 200, body: null, headers: {} }
  r.status = c => { r.code = c; return r }
  r.json = b => { r.body = b; return r }
  r.setHeader = (k, v) => { r.headers[k] = v }
  r.end = () => r
  return r
}
const req = (extra = {}) => ({ method: 'GET', headers: { 'x-demo-role': 'member' }, body: {}, ...extra })
const json = body => async () => ({ ok: true, json: async () => body })

const saved = { ...process.env }
beforeEach(() => { for (const k of Object.keys(process.env)) if (!(k in saved)) delete process.env[k]; Object.assign(process.env, saved); delete process.env.KATO8_DEMO; delete process.env.CLERK_SECRET_KEY })
after(() => { for (const k of Object.keys(process.env)) delete process.env[k]; Object.assign(process.env, saved) })

test('buildMetrics never invents a number: missing values are null and listed as unavailable', () => {
  const m = buildMetrics('x', { followers: 10 })
  assert.equal(m.followers, 10)
  for (const k of METRIC_KEYS.filter(k => k !== 'followers')) assert.equal(m[k], null, k)
  assert.deepEqual(m.unavailable, ['impressions', 'reach', 'clicks', 'engagement', 'growth'])
  assert.equal(buildMetrics('x', { followers: NaN }).followers, null)
})

test('each platform reports only what its API returned (the old endpoints fabricated the rest)', async () => {
  const cases = [
    [fetchYoutube, { YOUTUBE_API_KEY: 'k', YOUTUBE_CHANNEL_ID: 'c' }, { items: [{ statistics: { subscriberCount: '120', viewCount: '9000', videoCount: '12' } }] }, 120],
    [fetchTwitter, { TWITTER_BEARER_TOKEN: 't', TWITTER_USERNAME: 'u' }, { data: { public_metrics: { followers_count: 55, following_count: 3, tweet_count: 800 } } }, 55],
    [fetchInstagram, { INSTAGRAM_USER_TOKEN: 't', INSTAGRAM_USER_ID: '1' }, { followers_count: 77, media_count: 40 }, 77],
    [fetchLinkedin, { LINKEDIN_ACCESS_TOKEN: 't', LINKEDIN_ORG_ID: '1' }, { elements: [{ followerCounts: { organicFollowerCount: 33 } }] }, 33],
    [fetchTiktok, { TIKTOK_ACCESS_TOKEN: 't', TIKTOK_ADVERTISER_ID: '1' }, { code: 0, data: { account_info: { follower_count: 99 } } }, 99],
    [fetchBluesky, { BLUESKY_HANDLE: 'a.bsky.social' }, { followersCount: 21, followsCount: 2, postsCount: 9 }, 21],
  ]
  for (const [fetcher, env, payload, followers] of cases) {
    const { values } = await fetcher(env, json(payload))
    const m = buildMetrics('p', values)
    assert.equal(m.followers, followers, fetcher.name)
    for (const k of ['impressions', 'reach', 'clicks', 'engagement', 'growth']) assert.equal(m[k], null, `${fetcher.name}.${k}`)
  }
})

test('a missing follower count is null, not 0', async () => {
  const { values } = await fetchTiktok({ TIKTOK_ACCESS_TOKEN: 't', TIKTOK_ADVERTISER_ID: '1' }, json({ code: 0, data: {} }))
  assert.equal(buildMetrics('tiktok', values).followers, null)
})

test('unconfigured platforms answer 503 and upstream failures answer 502 without leaking details', async () => {
  // The auth gate reads process.env (demo role header); the injected env is empty so the live path runs.
  process.env.KATO8_DEMO = '1'
  const run = async fetcher => { const res = mkRes(); await platformHandler('youtube', fetcher, { env: () => ({}), fetchImpl: json({}) })(req(), res); return res }
  let res = await run(async () => { throw new PlatformError(503, 'Not configured') })
  assert.equal(res.code, 503)
  res = await run(async () => { throw new Error('secret-token-abc in message') })
  assert.equal(res.code, 502)
  assert.ok(!JSON.stringify(res.body).includes('secret-token'))
})

test('metrics routes require a signed-in role and GET', async () => {
  // No demo flag and no Clerk key: the gate must fail closed rather than serve data.
  const closed = platformHandler('bluesky', fetchBluesky, { env: () => ({}) })
  let res = mkRes()
  await closed(req({ headers: {} }), res)
  assert.ok([401, 503].includes(res.code), `unauthenticated must not pass (got ${res.code})`)
  process.env.KATO8_DEMO = '1'
  const open = platformHandler('bluesky', fetchBluesky, { env: () => ({ KATO8_DEMO: '1' }) })
  res = mkRes()
  await open(req({ method: 'POST' }), res)
  assert.equal(res.code, 405)
})

test('demo mode serves fictional labelled metrics', async () => {
  process.env.KATO8_DEMO = '1'
  const res = mkRes()
  await platformHandler('tiktok', fetchTiktok, { env: () => ({ KATO8_DEMO: '1' }) })(req(), res)
  assert.equal(res.body.source, 'demo')
  assert.equal(typeof res.body.followers, 'number')
})

test('AI route ignores a client-supplied model and refuses empty conversations; demo replies need no key', async () => {
  process.env.KATO8_DEMO = '1'
  let res = mkRes()
  await aiHandler(req({ method: 'POST', body: { model: 'claude-sonnet-4-20250514', messages: [] } }), res)
  assert.equal(res.code, 400)
  res = mkRes()
  await aiHandler(req({ method: 'POST', body: { model: 'claude-sonnet-4-20250514', messages: [{ role: 'user', content: 'hi' }] } }), res)
  assert.equal(res.code, 200)
  assert.match(res.body.content[0].text, /Demo mode/)
  res = mkRes()
  await aiHandler(req({ method: 'GET' }), res)
  assert.equal(res.code, 405)
})

test('the source holds no retired model id and no real handles or contact details', () => {
  const walk = d => readdirSync(d).flatMap(n => (['node_modules', 'dist', '.git'].includes(n) ? [] : statSync(join(d, n)).isDirectory() ? walk(join(d, n)) : [join(d, n)]))
  const files = [...walk('src'), ...walk('api'), '.env.example', 'README.md'].filter(f => /\.(jsx?|md|example)$/.test(f))
  const banned = [/claude-sonnet-4-20250514/, /kato\.?8_studios/i, /kato-8\.bsky/i, /Kato8_Studios/, /UCQYpZ5N4ZIEY/]
  for (const f of files) for (const re of banned) assert.ok(!re.test(readFileSync(f, 'utf8')), `${f} matches ${re}`)
})
