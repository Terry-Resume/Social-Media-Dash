import { platformHandler, PlatformError, count } from './_lib/platform.js'

export async function fetchLinkedin(env, fetchImpl) {
  if (!env.LINKEDIN_ACCESS_TOKEN || !env.LINKEDIN_ORG_ID) throw new PlatformError(503, 'Not configured')
  const r = await fetchImpl(
    `https://api.linkedin.com/v2/organizationalEntityFollowerStatistics?q=organizationalEntity&organizationalEntity=urn:li:organization:${encodeURIComponent(env.LINKEDIN_ORG_ID)}`,
    { headers: { Authorization: `Bearer ${env.LINKEDIN_ACCESS_TOKEN}`, 'LinkedIn-Version': '202304' } },
  )
  const d = await r.json()
  if (!r.ok) throw new PlatformError(400, 'LinkedIn rejected the request')
  return { values: { followers: count(d.elements?.[0]?.followerCounts?.organicFollowerCount) } }
}

export default platformHandler('linkedin', fetchLinkedin)
