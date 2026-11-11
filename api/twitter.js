import { platformHandler, PlatformError, count } from './_lib/platform.js'

export async function fetchTwitter(env, fetchImpl) {
  if (!env.TWITTER_BEARER_TOKEN || !env.TWITTER_USERNAME) throw new PlatformError(503, 'Not configured')
  const r = await fetchImpl(
    `https://api.twitter.com/2/users/by/username/${encodeURIComponent(env.TWITTER_USERNAME)}?user.fields=public_metrics`,
    { headers: { Authorization: `Bearer ${env.TWITTER_BEARER_TOKEN}` } },
  )
  const d = await r.json()
  const m = d.data?.public_metrics
  if (!m) throw new PlatformError(404, 'User not found')
  return { values: { followers: count(m.followers_count) }, extra: { following: count(m.following_count), posts: count(m.tweet_count) } }
}

export default platformHandler('twitter', fetchTwitter)
