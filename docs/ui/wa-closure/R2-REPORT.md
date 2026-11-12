# WhatsApp closure — R2 follow-up

**Date:** 2026-11-12  
**Deployed SHA:** `44768d8565452b81ec9872f9e956549e735cb30d`  
**Immutable tag:** `wa-closure-deployed-44768d8` (= production `DEPLOY_SHA`)  
**Prior immutable tag:** `wa-closure-deployed-bfd34dd`  
**`wa-closure-rc1`:** left untouched at `68ee9fd` (docs tip) — tags are no longer moved.

## Summary table

| Item | Result |
|------|--------|
| Provenance `bfd34dd..68ee9fd` | docs/shots only (6 files); no runtime |
| Outage alert | alerts on unexpected drop even if `CONNECT_ON_START=false`; suppress only never-connected / intentional logout / kill switch |
| Ops alert tests | 11 passed |
| Disk | 77% → 44% after prune; ~55% after R2 build |
| Perms | wa-auth 700/600; backups 700/600 |
| Smoke | health 200; PP once; 8 QR; trader 307; mergesNeeded=0; CONNECT=false |
| Rollback | `rare-oud-web:pre-wa-r2-20261112-063057` |

## Screenshots (folder `docs/ui/wa-closure/r2/`)

| File | What I SEE |
|------|------------|
| `r2-prod-inbox-1440.png` | «صندوق واتساب» @1440؛ غير متصل؛ الكل 12 |
| `r2-prod-inbox-390.png` | نفس الـ12 محادثة @390؛ شريط تبويب سفلي |
| `r2-context-drawer-close.png` | درج السياق مفتوح؛ زر إغلاق (X) أعلى الدرج؛ أفاتار غير مقصوص |
| `r2-merge-confirm.png` | حوار تأكيد الدمج؛ 1 محادثة + 2 رسالة؛ تأكيد بلون أوضح |
| `r2-thread-1280.png` | خيط @1280؛ الشارات تلتف؛ بانر فوق الفقاعات بلا تغطية |

Full SEE: `docs/ui/wa-closure/r2/SEE.md`.

## Worker restart note

If the worker restarts and reconnects within N minutes (default 5), heartbeat age stays under the threshold → **no outage alert**. Only a drop lasting longer than N minutes fires one de-duplicated alert.

## READY FOR OWNER TESTS (R2)
