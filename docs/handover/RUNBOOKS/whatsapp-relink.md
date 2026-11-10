# Runbook — WhatsApp re-link

## When to use

- Phone replaced or logged out from linked device
- Baileys session errors in worker logs
- After restoring an old `.wa-auth` backup that no longer matches Meta state

## Steps

1. **Stop outbound** (optional safety): set `WHATSAPP_OUTBOUND_ENABLED=false` and restart worker.
2. **Admin UI:** `/admin/inbox` → pairing / QR flow.
3. Scan QR with the designated business phone (WhatsApp → Linked devices).
4. Confirm worker logs show connected; send test inbound message.
5. Re-enable outbound if previously disabled.
6. Run `npm run test:whatsapp-phase-a` … `phase-e` on staging if available.

## CLI / volume reset (last resort)

1. Stop worker container.
2. Backup then clear `WHATSAPP_AUTH_DIR` volume contents (never commit to git).
3. Start worker, pair again via admin UI.
4. Historical messages remain in DB; new session ID may differ — verify conversation links in admin customers/requests.

## Production notes

- One active session per `WHATSAPP_AUTH_DIR`.
- Protect volume like a password (`secret-rotation.md`).
- Live phone linking remains **OWNER-ACTION** per `FINAL-REPORT.md` item 9.1.

## Number-survival checklist — read before the first real QR scan

This project uses an **unofficial linked-device connection (Baileys)**, not the official
WhatsApp Business Platform / Cloud API, because the official API is unavailable for this
business's situation. Baileys is not an authorized WhatsApp client, so every ban-risk
mitigation below is a *risk-reduction* measure, not a guarantee — there is no verified,
published WhatsApp rule for any of these numbers; they come from community/vendor
experience with unofficial clients, not from Meta.

**Before scanning the QR for the production number:**

1. **Don't use a brand-new SIM the same day.** Let the number sit active as an ordinary
   phone number (receiving calls/SMS) for a few days first if it's new.
2. **Complete the WhatsApp profile first**, on the phone itself, before linking: a real
   profile photo, a filled-in business name/description, and business hours — an empty,
   anonymous-looking profile is itself a risk signal separate from send volume.
3. **Warm up gradually after linking, before relying on it for real customer traffic.**
   Use it like an ordinary person would for several days: a few manual replies, a mix of
   text/photo, to real contacts who already have this number saved if possible. Don't jump
   straight to full volume on day one. There's no single agreed number here — treat the
   first 1-2 weeks as a ramp, not a switch.
4. **Keep the daily/window send caps in `.env.example` / `docs/handover/ENV-REFERENCE.md`
   conservative at first** (`WHATSAPP_OUTBOUND_DAILY_MAX`, `WHATSAPP_OUTBOUND_WINDOW_MAX`)
   and raise them gradually as the number's history builds, not on day one.
5. **This business only replies to customers who messaged first — never send a
   first-contact or promotional message.** This is already enforced by this project's own
   design (no bot, no broadcast, no group messaging — see `DECISIONS-ADDENDUM.md` "WhatsApp
   number survival"), and is the single biggest risk-reduction factor available: unsolicited
   outbound and bulk/broadcast sending are the behavior most consistently associated with
   bans in every source reviewed. Reply-only, low-volume use is *lower* risk than any
   bot/broadcast pattern, but is not risk-free by itself.
6. **Know the hosting-location caveat.** The production worker currently runs on the same
   VPS as the web app — a datacenter IP, which several (unverified, vendor-sourced) reports
   associate with a higher automatic risk score than a residential connection. There is no
   code fix for this; it is an infrastructure decision. If the number gets flagged
   repeatedly despite the measures above, consider whether the WhatsApp worker specifically
   (not the whole web app) should run from a residential-style connection instead — this
   would need its own infrastructure plan and owner approval, not something to change
   casually.
7. **If a ban/restriction happens anyway:** stop immediately (`WHATSAPP_OUTBOUND_ENABLED=false`,
   do not retry sending), do not re-pair repeatedly in a short window (frequent re-pairing is
   itself flagged as a risk signal in the sources reviewed), and treat it as a signal to
   slow down the ramp-up, not just retry the same pattern.

**What this project already does right, by design** (so the above checklist is about what's
*left*, not starting from zero): no group chats, no broadcast lists, no automated/bot
replies — every send is a human agent typing in the admin inbox; a pacing layer
(`lib/whatsapp/outbound-safety.ts`) enforces a minimum gap + random jitter between sends, a
rolling burst window, a daily cap, and a failure circuit-breaker that pauses sending after
repeated transport errors; outbound sends show a real "typing…"/"recording…" presence to the
recipient before the message lands, instead of appearing instantaneously.
