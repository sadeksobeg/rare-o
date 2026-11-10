# W1 send → ✓ → ✓✓ frame sequence

Static evidence frames (UI states). Capture live screenshots on staging/review host after approve.

```
Frame A — optimistic
┌─────────────────────────────┐
│ اختبار                      │
│ 17:30  ⏱ sending            │
└─────────────────────────────┘
composer empty

Frame B — sent (SSE message.status)
┌─────────────────────────────┐
│ اختبار                      │
│ 17:30  ✓ sent               │
└─────────────────────────────┘

Frame C — delivered (SSE message.status)
┌─────────────────────────────┐
│ اختبار                      │
│ 17:30  ✓✓ delivered         │
└─────────────────────────────┘
```

No `router.refresh` interval required between B and C — EventSource carries `message.status`.
