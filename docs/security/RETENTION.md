# Data retention and deletion (F3)

| Data | Retention | Deletion |
|------|-----------|----------|
| Retail / wholesale requests | Keep while business-active; review annually &gt; 24 months | Admin purge or `scripts/purge-demo.ts` patterns; hard-delete cascades lines/events |
| WhatsApp messages | Keep while conversation linked; unlink does not auto-delete | Soft policy: operator deletes conversation rows via admin tools (future UI) |
| Uploads | While product exists | Delete product or replace media |
| Admin audit log | ≥ 12 months | Archive then delete oldest |
| Backups | 7 daily + 4 weekly (off-site) | Prune scripts |

Customer data deletion on request: verify identity → delete Customer + linked requests notes → confirm in audit log.
