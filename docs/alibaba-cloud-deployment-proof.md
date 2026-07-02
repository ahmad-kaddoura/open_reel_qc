# Alibaba Cloud Deployment Proof

This project is designed to run its Next.js backend on Alibaba Cloud and call Qwen Cloud / DashScope services from server-side API routes.

## Public Recording

TODO_ADD_PUBLIC_RECORDING_LINK

The recording should be separate from the product demo and should briefly show:

1. The Alibaba Cloud-hosted backend or server console.
2. The deployed app or backend health/API route responding.
3. Environment variables configured for Qwen Cloud, with secrets hidden.
4. A server-side request that reaches Qwen Cloud or DashScope.

## Code Proof

Primary code proof:

- [`src/lib/qwen-client.ts`](../src/lib/qwen-client.ts)

This file demonstrates Alibaba Cloud service usage through:

- `https://dashscope-intl.aliyuncs.com/compatible-mode/v1` as the Qwen Cloud OpenAI-compatible base URL.
- Bearer-token calls to `/chat/completions` for Qwen text and vision agents.
- Calls to `/images/generations` for Qwen image generation.
- DashScope image synthesis task submission and polling.
- DashScope Wan video synthesis task submission and polling.
- DashScope motion-control task submission and polling.
- DashScope upload policy and temporary OSS media upload handling.

Supporting API routes:

- [`src/app/api/chat/route.ts`](../src/app/api/chat/route.ts)
- [`src/app/api/enhance-prompt/route.ts`](../src/app/api/enhance-prompt/route.ts)
- [`src/app/api/generate-scene/route.ts`](../src/app/api/generate-scene/route.ts)
- [`src/app/api/health/route.ts`](../src/app/api/health/route.ts)

## Deployment Shape

- Alibaba Cloud ECS or equivalent VM runs the Next.js standalone server.
- Caddy reverse-proxies public traffic to the app on port 3000 using [`Caddyfile`](../Caddyfile).
- Server-side environment variables provide Qwen Cloud credentials.
- The backend keeps API keys off the browser and performs all Qwen/DashScope requests from the server.

## Suggested Recording Script

1. Open the Alibaba Cloud instance/app dashboard and show the running service.
2. Open the deployed OpenScene URL.
3. Open `https://YOUR_DEPLOYED_DOMAIN/api/health` and show `qwenConfigured: true` and `qwenHost: dashscope-intl.aliyuncs.com`.
4. Open the settings or terminal with secret values hidden and show `QWEN_BASE_URL=https://dashscope-intl.aliyuncs.com/compatible-mode/v1`.
5. Trigger a chat or scene-generation action.
6. Show the backend logs recording the API route and Qwen/DashScope response or task id.
