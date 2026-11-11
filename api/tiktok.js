import { platformHandler, PlatformError, count } from './_lib/platform.js'

// NOTE: not verified against the current TikTok Business API. If the account payload has no follower
// count the dashboard shows "—" rather than a made-up number.
export async function fetchTiktok(env, fetchImpl) {
  if (!env.TIKTOK_ACCESS_TOKEN || !env.TIKTOK_ADVERTISER_ID) throw new PlatformError(503, 'Not configured')
  const r = await fetchImpl(
    `https://business-api.tiktok.com/open_api/v1.3/bc/account/get/?bc_id=${encodeURIComponent(env.TIKTOK_ADVERTISER_ID)}`,
    { headers: { 'Access-Token': env.TIKTOK_ACCESS_TOKEN, 'Content-Type': 'application/json' } },
  )
  const d = await r.json()
  if (d.code !== 0) throw new PlatformError(400, 'TikTok rejected the request')
  return { values: { followers: count(d.data?.account_info?.follower_count) } }
}

export default platformHandler('tiktok', fetchTiktok)
