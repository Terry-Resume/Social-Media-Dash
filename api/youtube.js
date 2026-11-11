import { platformHandler, PlatformError, count } from './_lib/platform.js'

export async function fetchYoutube(env, fetchImpl) {
  if (!env.YOUTUBE_API_KEY || !env.YOUTUBE_CHANNEL_ID) throw new PlatformError(503, 'Not configured')
  const r = await fetchImpl(`https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${encodeURIComponent(env.YOUTUBE_CHANNEL_ID)}&key=${encodeURIComponent(env.YOUTUBE_API_KEY)}`)
  const d = await r.json()
  const s = d.items?.[0]?.statistics
  if (!s) throw new PlatformError(404, 'Channel not found')
  return {
    values: { followers: s.hiddenSubscriberCount ? null : count(s.subscriberCount) },
    // Lifetime views are real, but they are not impressions, reach or clicks, so they are not reported as such.
    extra: { totalViews: count(s.viewCount), posts: count(s.videoCount) },
  }
}

export default platformHandler('youtube', fetchYoutube)
