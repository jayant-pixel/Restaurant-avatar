# LiveAvatar Restaurant Demo

Minimal Next.js app for a restaurant-facing LiveAvatar `FULL` mode experience.

The project now contains only the working pieces:
- one App Router page
- one server route for session bootstrap
- one client session provider
- one fullscreen avatar UI with live transcript and voice controls

## Stack

- Next.js `16.2.3`
- React `19.2.5`
- LiveAvatar Web SDK `@heygen/liveavatar-web-sdk`
- Tailwind CSS

## Environment

Copy `.env.example` to `.env` and set:

- `LIVEAVATAR_API_KEY`
- `LIVEAVATAR_AVATAR_ID`
- `LIVEAVATAR_CONTEXT_ID`

Optional:

- `LIVEAVATAR_VOICE_ID`
- `LIVEAVATAR_LANGUAGE`
- `LIVEAVATAR_IS_SANDBOX`
- `LIVEAVATAR_STT_PROVIDER`
- `LIVEAVATAR_MAX_SESSION_DURATION`

## Run

```bash
npm install
npm run dev
```

## Architecture

- `app/api/liveavatar/session/route.ts`
  Creates a LiveAvatar session token on the server.
- `app/lib/liveavatar.ts`
  Shared request typing and payload construction for LiveAvatar sessions.
- `components/logic/context.tsx`
  Central session state, transcript handling, voice lifecycle, and cleanup.
- `components/InteractiveAvatar.tsx`
  Idle screen, start flow, and fullscreen avatar session container.
- `components/AvatarSession/AvatarUI.tsx`
  Live transcript, mic toggle, connection badge, and end-session action.

## Notes

- This app is for LiveAvatar `FULL` mode only.
- Restaurant behavior, guardrails, KB, and welcome prompt belong in the LiveAvatar `context_id`.
- The API key stays server-side and is never exposed to the browser.

## References

- LiveAvatar docs: https://docs.liveavatar.com
- Create Session Token API: https://docs.liveavatar.com/api-reference/sessions/create-session-token
- Start Session API: https://docs.liveavatar.com/api-reference/sessions/start-session
- LiveAvatar Web SDK: https://github.com/heygen-com/liveavatar-web-sdk
