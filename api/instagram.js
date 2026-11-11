import { platformHandler, PlatformError, count } from './_lib/platform.js'

export async function fetchInstagram(env, fetchImpl) {
  if (!env.INSTAGRAM_USER_TOKEN || !env.INSTAGRAM_USER_ID) throw new PlatformError(503, 'Not configured')
  // Set INSTAGRAM_GRAPH_VERSION to a Graph API version that is currently supported.
  const version = env.INSTAGRAM_GRAPH_VERSION || 'v23.0'
  const r = await fetchImpl(
    `https://graph.facebook.com/${version}/${encodeURIComponent(env.INSTAGRAM_USER_ID)}?fields=followers_count,media_count&access_token=${encodeURIComponent(env.INSTAGRAM_USER_TOKEN)}`,
  )
  const d = await r.json()
  if (d.error) throw new PlatformError(400, 'Instagram rejected the request')
  return { values: { followers: count(d.followers_count) }, extra: { posts: count(d.media_count) } }
}

export default platformHandler('instagram', fetchInstagram)
