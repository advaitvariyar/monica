# Monica — Design Spec

Visual mockups of the key screens (availability grid, event time picker, voting, guest phone view): https://claude.ai/artifact/HTT1EgrvY1JuAxvoFPyEwD

Aesthetic: **clean & minimal**. Calm neutrals, one accent color, lots of whitespace, thin borders instead of shadows. The interface should feel quiet so the availability heatmap — the core visual — stands out.

## Tokens
Define as CSS variables in `app/globals.css` (Tailwind v4 `@theme`), shadcn-compatible names.

| Token | Light | Dark |
|---|---|---|
| `--background` | white | zinc-950 |
| `--surface` (cards, sidebars) | zinc-50 | zinc-900 |
| `--border` | zinc-200 | zinc-800 |
| `--foreground` | zinc-900 | zinc-50 |
| `--muted-foreground` | zinc-500 | zinc-400 |
| `--accent` / `--primary` | indigo-600 | indigo-400 |
| `--success` (yes / going) | emerald-600 | emerald-400 |
| `--warning` (maybe) | amber-500 | amber-400 |
| `--danger` (no / busy) | rose-600 | rose-400 |

- **Heatmap scale:** accent at 0 / 15 / 35 / 55 / 75 / 100% opacity, mapped to fraction of group free. 100% = everyone free (also gets a subtle ring).
- **Type:** Geist Sans (UI), Geist Mono (times, dates in grids). Sizes: 12 / 14 (body) / 16 / 20 / 28 / 40. Weights 400 / 500 / 600 only.
- **Spacing:** 4px base, mostly 8 / 12 / 16 / 24 / 32. Page gutter 16px mobile, 24px desktop. Max content width 1100px.
- **Radius:** `rounded-lg` (8px) inputs/buttons, `rounded-xl` (12px) cards, `rounded-full` avatars/chips.
- **Elevation:** none by default; 1px border. Popovers/dialogs get `shadow-sm` only.
- **Motion:** 150ms ease-out on hover/press; no decorative animation.
- Light and dark mode both required; follow system preference, toggle in settings.

## Layout
- **Desktop:** top bar — wordmark "monica" (left), nav: Home · Groups · Availability (center/left), avatar menu (right).
- **Mobile (<640px):** compact top bar with wordmark + avatar; bottom tab bar with the three nav items. All tap targets ≥ 44px.
- Page header pattern: title (28px/600) + muted subtitle + primary action on the right.

## Core components
- **AvailabilityGrid** (client) — 7 columns (Mon–Sun) × 30-min rows (default view 7am–midnight, scrollable to 24h). Click-drag to paint/erase free time; painted cells = solid indigo-400, unset cells = zinc-100, 2px gaps, 3px radius. Sticky day header + time gutter in mono. On mobile show 3 days at a time with swipe/pager.
- **Heatmap** (client) — same grid geometry but read-only, cells colored by heatmap scale. Hover/tap a cell → popover listing who's free / busy with avatars. Click to select a start time (selected slot outlined in foreground color).
- **SuggestionChip** — "Sat Nov 15 · 2:00–4:00pm · 5/5 free"; check icon when selected; max 5 selected.
- **SlotRow** — date/time on left (mono), voter avatar stacks grouped Yes / Maybe / No, and three segmented buttons (✓ / ~ / ✕) for the viewer's vote. Leading slot gets a "Most popular" badge.
- **AvatarStack** — up to 4 overlapping 24px avatars + "+N".
- **EmptyState** — lucide icon in muted circle, one sentence, one primary action.
- **Toasts** for action results (sonner via shadcn).

## Screens
1. **Landing `/`** — Centered hero: "Find a time that works for everyone." Subtitle one line. Buttons: *Continue with Google* (primary) / *Use email*. Below: a static, illustrative heatmap card. Nothing else.
2. **Login `/login`** — Narrow card: Google button, divider "or", email field + "Send magic link". Success state: "Check your inbox" with the email shown and a resend link.
3. **Home `/home`** — Sections: *Needs your vote* (event cards with Vote button), *Upcoming* (scheduled events with date block), *Your groups* (grid of group cards with emoji, name, member avatars). Empty states for each.
4. **Availability `/availability`** — Tabs: **Weekly** (AvailabilityGrid + timezone select + "Copy Mon to weekdays" helper, autosave with "Saved" indicator) and **One-time** (list of upcoming overrides, "Add block" dialog: date, start, end, Free/Busy toggle).
5. **Groups `/groups`** — card grid + "New group" dialog (emoji picker + name).
6. **Group `/groups/[id]`** — header with emoji/name, *Members* list (avatar, name, "pending" badge for invites), *Invite friends* dialog (multi-email input with chips, paste comma-separated), *Events* list (polling / scheduled / past), primary "Plan a hangout".
7. **New event `/groups/[id]/events/new`** — stepper:
   1. *Details:* title, optional description & location, duration (30m / 1h / 2h / 3h / custom), date window (default next 14 days).
   2. *Pick times:* Heatmap left (week pager), right rail with ranked SuggestionChips; selected slots listed at bottom.
   3. *Review & send:* summary card, recipient list (all group members, checkboxes), optional personal note, "Send invites" button → confirmation toast.
8. **Event `/events/[id]`** — header (title, group, location, creator), status pill (Polling / Scheduled). Polling: list of SlotRows; creator sees "Finalize" on each row and a "Nudge non-voters" action. Scheduled: big date card, Going / Maybe / Can't segmented RSVP, attendee list, "Add to calendar" (.ics).
9. **Guest `/e/[token]`** — same as event view without nav; header shows "Hi Sam — Alex invited you". One-tap voting; footer offers "Create an account to save your availability".
10. **Invite `/invite/[token]`** — group card + "Join group" (→ login if needed). Expired/used token state.
11. **Settings `/settings`** — name, avatar, timezone (auto-detected default), theme, email notification toggles, sign out.

## Emails (React Email)
Same tokens, single-column 560px, white card on zinc-50, wordmark top, one primary button.
- **Group invite:** "Alex invited you to *Weekend Crew* on Monica" → Join.
- **Event invite:** title, note, list of proposed slots in recipient's TZ (if known) → "Vote on times".
- **Event confirmed:** date/time block, location → "View event"; `.ics` attached.
- **Reminder:** "Board game night is tomorrow at 7pm."

## States to always design
Loading (skeletons matching layout, shown via `<Suspense>`), empty, error (inline message + retry), no-availability member ("hasn't set availability" muted badge in heatmap popover), and timezone mismatch hint.
