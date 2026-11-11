import { requireUser, createMessage } from '@kato8/core/server'
import { ALL_ROLES } from '@kato8/core'

// Signed-in staff only. The server picks the model (ANTHROPIC_MODEL, default in @kato8/core); a model sent
// by the browser is ignored, so the studio key cannot be pointed at an arbitrary or retired model.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  if (!(await requireUser(req, res, { roles: ALL_ROLES }))) return
  const { system, messages, max_tokens } = req.body ?? {}
  if (!Array.isArray(messages) || messages.length === 0) return res.status(400).json({ error: 'messages required' })
  const out = await createMessage({ system, messages, max_tokens }, { kind: 'social', maxTokens: 2000 })
  res.status(out.status).json(out.data)
}
