import { platformHandler, PlatformError, count } from './_lib/platform.js'

// Bluesky's public API needs no key, only the account handle (BLUESKY_HANDLE, e.g. studio.bsky.social).
export async function fetchBluesky(env, fetchImpl) {
  if (!env.BLUESKY_HANDLE) throw new PlatformError(503, 'Not configured')
  const r = await fetchImpl(`https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=${encodeURIComponent(env.BLUESKY_HANDLE)}`)
  const d = await r.json()
  if (d.error) throw new PlatformError(400, 'Bluesky rejected the request')
  return { values: { followers: count(d.followersCount) }, extra: { following: count(d.followsCount), posts: count(d.postsCount) } }
}

export default platformHandler('bluesky', fetchBluesky)
