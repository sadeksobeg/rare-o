# Hypercare plan (T+0 → T+14)

## T+0 (launch day)

- Monitor uptime every 30 min (`smoke:prod`, error logs).
- Owner available for WA pairing issues.
- Freeze non-critical deploys.

## T+1 → T+3

- Daily check: request volume, failed handoffs, worker restarts.
- Review admin/trader feedback ticket queue.
- Lighthouse spot check if traffic heavy (optional).

## T+4 → T+7

- Second backup restore drill on staging (optional).
- Content tweaks via admin (no schema changes unless hotfix).

## T+8 → T+14

- Exit hypercare when:
  - 7 consecutive days without S2+ incidents
  - Owner confirms WA + orders flow stable
- Hand off to standard ops (`RUNBOOKS/incident.md`).

## Escalation

| Window | Contact |
|--------|---------|
| Business hours | _fill owner_ |
| After hours S1 | _fill on-call_ |

## Metrics to watch

- `/api/health` latency
- Retail request → handoff_opened conversion (admin reports)
- WhatsApp worker reconnect count
