# Brokerage (الوساطة) — build spec

Owner-approved in `VISION.md` §7. Fourth commercial domain — separate from retail / deals / wholesale. No online payment.

## Models

- `BrokerageRequest` — trader-owned request + lifecycle status
- `BrokerageInspection` — optional 1:1 report (grade, notes, verdict, photo paths JSON)
- `BrokerageQuote` — goods value, commission rate 1–2%, shipping, validity
- `BrokerageEvent` — append-only timeline

## Status lifecycle

`SUBMITTED` → `NEEDS_INFO` | `ACCEPTED` → `INSPECTION_SCHEDULED` → `INSPECTED` → `QUOTE_SENT` → `APPROVED` → `PURCHASED` → `SHIPPED` → `DELIVERED` → `CLOSED`

Terminal: `DECLINED` (admin), `REJECTED` (trader declines quote), `CANCELLED`.

## Permissions

- Trader: CRUD own requests only; approve/reject quote when `QUOTE_SENT`.
- Admin: all transitions valid for current status; schedule inspection; write report; send quote; purchase/ship.

## Routes

- Trader: `/trader/brokerage`, `/trader/brokerage/new`, `/trader/brokerage/[id]`
- Admin: `/admin/brokerage`, `/admin/brokerage/[id]`
