@AGENTS.md

# Monica — group hangout planner

Monica is a website for friends to plan hangouts. Users log in, record when they're free (weekly recurring blocks + one-time overrides), create groups, invite friends, and create events. Monica suggests times from the group's overlapping availability, the creator proposes a few slots, and an email blast goes out so everyone can vote/RSVP — including friends without an account, via a tokenized link.

Visual/UX spec lives in [docs/design.md](docs/design.md). Read it before building any UI.

## Tech stack
| Concern | Choice |
|---|---|
| Framework | Next.js 16 App Router — Server Components + Server Actions. `cacheComponents` and `partialPrefetching` are on (see `next.config.ts`). |
| Language | TypeScript (strict) |
| Database | Neon Postgres (`@neondatabase/serverless` Pool/WebSocket driver, so transactions work) |
| ORM | Drizzle ORM + drizzle-kit migrations, `casing: "snake_case"` (camelCase in TS, snake_case in SQL) |
| Auth | Better Auth — Google OAuth + magic-link plugin, Drizzle adapter |
| Email | Resend (batch API, ≤100 recipients/call) + React Email templates |
| UI | Tailwind v4 + shadcn/ui (`base-nova` style, built on **Base UI**, not Radix) + lucide-react; Geist + Geist Mono via `next/font` |
| Validation | Zod — one schema shared by form + server action |
| Dates | date-fns + `@date-fns/tz` |
| Tests | Vitest (unit, esp. scheduling) + Playwright (e2e) |
| Hosting | Vercel (+ Vercel Cron for reminders) |

### Next.js 16 gotchas (read the bundled docs in `node_modules/next/dist/docs/`)
- Middleware is now **`proxy.ts`** at the project root. Use it only for optimistic auth redirects — never as the authorization layer.
- With Cache Components, anything reading `cookies()`/session is request-time and must sit behind `<Suspense>`. Follow `01-app/02-guides/authentication-with-cache-components.md`.
- `LayoutProps<"/">` / `PageProps<"/route">` are global typed helpers — use them for route props.

## Directory layout (target)
```
app/
  (marketing)/page.tsx          landing
  login/                        Google + magic link
  (app)/                        authenticated shell (nav)
    home/  availability/  groups/[id]/  groups/[id]/events/new/  events/[id]/  settings/
  e/[token]/                    guest event view (no login)
  invite/[token]/               accept group invite
  api/auth/[...all]/route.ts    Better Auth handler
components/ui/                  shadcn components (generated, editable)
components/                     app components (AvailabilityGrid, Heatmap, SlotRow, ...)
db/schema.ts  db/index.ts       Drizzle schema + client
drizzle/                        generated migrations (commit these)
lib/auth.ts                     Better Auth server config
lib/dal.ts                      Data Access Layer: getCurrentUser, requireGroupMember, ...
lib/scheduling/                 pure availability/overlap logic + tests
lib/tokens.ts                   create/hash/verify invite tokens
emails/                         React Email templates
proxy.ts
```

## Data model (`db/schema.ts`)
- Better Auth tables: `user` (+ `timezone` IANA string), `session`, `account`, `verification`.
- `availability_rule` — weekly recurring: `userId, dayOfWeek (0 = Sunday … 6 = Saturday, like Date#getDay), startMinute, endMinute, timezone`.
- `availability_override` — one-time: `userId, startsAt, endsAt (UTC), kind 'available'|'busy'`.
- `group` (`name, emoji, ownerId`), `group_member` (`groupId, userId, role 'owner'|'member'`).
- `group_invite` — `groupId, email, tokenHash, invitedBy, expiresAt, acceptedAt`.
- `event` — `groupId, creatorId, title, description, location, durationMinutes, windowStart, windowEnd, status 'polling'|'scheduled'|'cancelled', finalSlotId`.
- `event_slot` — `eventId, startsAt, endsAt`.
- `event_invitee` — `eventId, email, userId?, tokenHash, rsvp 'going'|'maybe'|'no'|null`.
- `slot_vote` — `slotId, inviteeId, response 'yes'|'maybe'|'no'` (unique per slot+invitee).
- `email_log` — `eventId, kind, recipientCount, resendBatchId, sentAt`.

## Time & timezone rules (important)
- Store every instant as UTC `timestamptz`. Never store local wall-clock times except in `availability_rule` (minutes-of-day + its own `timezone`).
- Expand weekly rules into concrete intervals **in the rule's timezone**, then convert to UTC — this is what keeps DST correct.
- Render times in the viewer's timezone (`user.timezone`, or browser TZ for guests). Show the TZ abbreviation when members span zones.

## Scheduling algorithm (`lib/scheduling/`)
Pure functions only, no DB — must have thorough Vitest coverage (DST transitions, overnight blocks, overlapping overrides, empty availability).
1. Per member: expand weekly rules over `[windowStart, windowEnd]` → ∪ `available` overrides → − `busy` overrides → merged free intervals.
2. Sweep-line across members → segments tagged with the set of free member IDs.
3. Candidate slots of `durationMinutes` on a 15-min grid, ranked by free-count desc, then "everyone free", then earliest start.
4. Creator picks 1–5 candidates to propose (or adds a custom time).

## Auth & security rules
- All authorization goes through `lib/dal.ts` (e.g. `requireGroupMember(groupId)`), called at the top of every server action and data-loading function. Never trust IDs from the client.
- Tokens (group invites, guest event links): 32 random bytes, base64url in the URL, **SHA-256 hash stored** in DB, with expiry. Guest tokens scope access to exactly one `event_invitee`.
- Never send other users' email addresses to the client unless the viewer is in the same group.
- Rate-limit invite sends and magic-link requests.

## Conventions
- Server Components fetch data directly via the DAL; no client-side fetching for initial page data.
- Mutations are Server Actions in a colocated `actions.ts`, validated with Zod, returning `{ ok, error? }` for `useActionState`.
- Use shadcn/ui components; don't hand-roll buttons/dialogs/inputs. Follow tokens in `docs/design.md`.
- Email sending lives behind `lib/email.ts`; in dev with no `RESEND_API_KEY`, log emails to the console instead.
- Keep components small; client components (`"use client"`) only where interaction requires it (availability grid, heatmap hover, vote buttons).

## Commands
```
npm run dev           # next dev
npm run build         # production build
npm run lint
npm run typecheck     # tsc --noEmit
npm run db:generate   # drizzle-kit generate --name <change>  (after editing db/schema.ts)
npm run db:migrate    # apply migrations in drizzle/ to DATABASE_URL_UNPOOLED
npm run db:studio     # browse the database
npm run test          # vitest run (tests are *.test.ts next to the code)
npm run e2e           # playwright test        (to add in phase 7)
```

Requires **Node ≥ 22.12** (`.nvmrc` = 24). Older Node fails the build: `@tailwindcss/turbopack` `require()`s the ESM-only `magic-string`.

## Environment variables (`.env.local`, never committed; template in `.env.example`)
`DATABASE_URL` (Neon pooled), `DATABASE_URL_UNPOOLED` (Neon direct, migrations only), `BETTER_AUTH_SECRET`, `APP_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `RESEND_API_KEY`, `EMAIL_FROM`. Validated with Zod in `lib/env.ts`. Import `env` from there, never read `process.env` directly. Google and Resend are optional in dev.

## Design tokens
Theme lives in `app/globals.css`: zinc/indigo tokens, plus `success`, `warning`, `surface` and heatmap colors `bg-heat-0` … `bg-heat-5`. Dark mode follows `prefers-color-scheme` (the `dark:` variant is a media query, not a `.dark` class).

## Roadmap
- [x] **1. Foundation** — install deps, `shadcn init`, Drizzle + Neon client, schema + first migration, `lib/env.ts`, app shell + nav.
- [ ] **2. Auth** — Better Auth (Google + magic link), `/login`, `proxy.ts` redirects, `lib/dal.ts`, `/settings` with timezone.
- [ ] **3. Availability** — weekly grid editor (drag to paint), one-time overrides, `lib/scheduling` + Vitest suite.
- [ ] **4. Groups & invites** — create/edit groups, invite by email, `/invite/[token]` accept flow.
- [ ] **5. Events** — create flow, availability heatmap + ranked suggestions, propose slots, invite email blast.
- [ ] **6. Voting & RSVP** — `/events/[id]` and guest `/e/[token]`, finalize slot, confirmation email with `.ics`.
- [ ] **7. Polish** — reminder emails (Vercel Cron), empty/loading/error states, mobile pass, Playwright e2e, deploy to Vercel.

Update the checkboxes as phases land.
