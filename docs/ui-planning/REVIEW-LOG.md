# Self-review log (VISION.md section 9)

Brief, factual notes per screen: what changed between the two critique passes and why.

## login.html (Wave 1)

**Pass 1 (build → first screenshot):** Split layout works — dark living brand scene (breathing resonance rings, grain, waveform, cursor-reactive glow) against a light form panel reads as intentional, not generic. Role switch (Admin/Trader) with sliding pill was broken on first render: the indicator used `inset-inline-start:0` combined with a `translateX` offset computed from LTR-assumption math, which in this RTL document pushed the indicator entirely outside its container. Fixed by switching to a physical `left` value computed directly from measured `getBoundingClientRect()` positions (direction-agnostic since the measurement itself already accounts for RTL layout) instead of mixing a logical CSS property with a transform.

**Pass 2 (after fix, full interaction test):** Verified live: role switch slides correctly in both directions and updates title/subtitle copy; password show/hide toggles and swaps the eye/eye-off icon; Caps Lock warning appears/disappears on keyup; forgot-password view swap works with a working back link; submit flow demonstrates loading (waveform dots) → error shake → loading → success (view transition where supported) → redirect to the matching role's home. axe: zero violations at 375 and 1440 after adding the missing `<main>` landmark (first run flagged `landmark-one-main` + `region`). No horizontal overflow at 375.

**Known limitation:** the rate-limit state (3+ failed attempts) is styled and wired but not reachable through the normal 2-attempt demo flow (1st fails, 2nd succeeds, by design so the reviewer doesn't have to fail three times to see success) — inspectable by setting `attempts` past the threshold in dev tools. Documented rather than silently left for someone else to find.
