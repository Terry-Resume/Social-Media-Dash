# Kato.8 Studios — Social Media Dashboard

One place for a small game studio's social presence: per-platform follower metrics, a content scheduler, a support
ticket queue, and an AI assistant that drafts posts and replies in the studio's voice.

> Part of the **Kato.8 internal-tools suite** (ten tools plus the [`central-command`](https://github.com/Terry-Resume/central-command)
> hub), all built on [`@kato8/core`](https://github.com/Terry-Resume/kato8-core) for auth, model config and shared data.
> The public build runs on a **fictional studio** in demo mode, with no keys, accounts or real handles.

## Try it (no accounts, no keys)

```bash
npm install
KATO8_DEMO=1 VITE_KATO8_DEMO=1 npm run dev      # http://localhost:5173
```

`npm run dev` also serves the `/api` handlers locally (see `vite.config.js`), so nothing else needs to run.
A banner at the bottom of the screen switches between `super_admin`, `team_lead`, `social_media_manager` and `member`;
the API applies the same 401/403 rules as production. Demo metrics are labelled `source: "demo"` in every response.

## Honest metrics

The original endpoints filled in impressions, reach, clicks, engagement and growth with made-up numbers whenever the
platform did not provide them, so the dashboard showed figures that did not exist. That is gone.

- Each `/api/<platform>` route returns only what that platform's API actually reported.
- Anything it did not report is `null`, listed in the response's `unavailable` array, and rendered as **—** in the UI.
- Platforms that are not connected show clearly labelled sample data, never a quiet zero.

| Platform | Live source | Reported today |
| --- | --- | --- |
| YouTube | Data API v3 `channels` | subscribers (unless the channel hides them), total views, videos |
| X / Twitter | API v2 `users/by/username` | followers, following, posts |
| Instagram | Graph API user node | followers, media count |
| LinkedIn | Organization follower statistics | organic followers |
| TikTok | Business API | followers (when the account exposes them) |
| Bluesky | Public `getProfile` | followers, following, posts |

Reach, impressions and engagement need separate insight endpoints and permissions on most platforms; they stay
`null` until those are wired, which is deliberate.

## Access control

Every `/api` route verifies a Clerk session and the user's `publicMetadata.role` through `@kato8/core/server`, and
**fails closed**: with Clerk unconfigured the API answers `503`, never "allowed".

| Route | Method | Roles |
| --- | --- | --- |
| `/api/youtube`, `/twitter`, `/instagram`, `/linkedin`, `/tiktok`, `/bluesky` | GET | any signed-in staff role |
| `/api/ai` | POST | any signed-in staff role |
| `/api/health` | GET | public (reports checks only, no secrets) |

The AI route never trusts a client-supplied `model`; the server chooses it from `@kato8/core` (and refuses retired ids),
caps `max_tokens`, and requires a non-empty conversation. Upstream failures return a generic `502` and are logged
server-side, so tokens and provider messages never reach the browser.

## Configuration

Copy `.env.example`. Everything except Clerk and the AI key is optional; an unset platform simply shows as not connected.

| Variable | Purpose |
| --- | --- |
| `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, `VITE_CLERK_PUBLISHABLE_KEY` | Auth (required outside demo mode) |
| `ANTHROPIC_API_KEY` | AI assistant (server side only) |
| `YOUTUBE_API_KEY`, `YOUTUBE_CHANNEL_ID` | YouTube |
| `TWITTER_BEARER_TOKEN`, `TWITTER_USERNAME` | X / Twitter |
| `INSTAGRAM_USER_TOKEN`, `INSTAGRAM_USER_ID`, `INSTAGRAM_GRAPH_VERSION` | Instagram |
| `LINKEDIN_ACCESS_TOKEN`, `LINKEDIN_ORG_ID` | LinkedIn |
| `TIKTOK_ACCESS_TOKEN`, `TIKTOK_ADVERTISER_ID` | TikTok |
| `BLUESKY_HANDLE` | Bluesky (no key needed) |

`KATO8_DEMO` / `VITE_KATO8_DEMO` are ignored whenever `CLERK_SECRET_KEY` is set, so a stray flag cannot open a real deployment.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Vite dev server with the `/api` handlers mounted locally |
| `npm test` | Node test runner: metric honesty, per-platform parsing, auth gate, AI route, no-retired-model scan |
| `npm run lint` | ESLint (React + hooks) |
| `npm run build` | Production build to `dist/` |

CI runs lint, tests, build and `npm audit` on every push.

## Deploy

Import the repo into Vercel (framework: Vite). `vercel.json` routes everything except `/api/*` to the SPA. Set the
variables above in the project settings; no secret is ever read by the browser bundle.

## License

MIT
