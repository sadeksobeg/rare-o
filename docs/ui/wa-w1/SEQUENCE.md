# W1 send → ✓ → ✓✓ — real screenshots

Captured from a running Next instance via the **simulated worker** harness
(`/dev/wa-w1-evidence`) with outbound flags off — **no real WhatsApp send**.
Frames advance in-page (no reload), matching SSE `message.status` /
`connection.state` behaviour.

| Frame | File | What it shows |
|-------|------|----------------|
| A — optimistic / sending | [`shots/frame-sending.png`](./shots/frame-sending.png) | Composer cleared; clock/spinner on outbound bubble |
| B — sent | [`shots/frame-sent.png`](./shots/frame-sent.png) | Single ✓ |
| C — delivered | [`shots/frame-delivered.png`](./shots/frame-delivered.png) | ✓✓ |
| D — failed + retry | [`shots/frame-failed.png`](./shots/frame-failed.png) | Failed mark + retry affordance |
| E — kill switch | [`shots/frame-kill.png`](./shots/frame-kill.png) | Emergency banner with who/when/reason; composer disabled |

Re-capture:

```bash
# terminal A
npx next dev
# terminal B
npx tsx scripts/wa-w1-evidence-capture.ts
```
