# G0 — Remote check (2026-10-20)

## Remote
```
origin  https://github.com/sadeksobeg/rare-o.git (fetch/push)
origin/master = 665380d (matches local HEAD at check time)
```

## Workflows
- `ci.yml` — **push** to `master`/`main` + `workflow_dispatch` only (heavy).
- `ci-light.yml` — **pull_request** only (lint/tsc/unit).
- Triggers include `master` (not main-only).
- Concurrency cancel-in-progress; npm cache + Playwright browser cache.

## Secrets scan
`node scripts/g0-secrets-scan.mjs` → `G0-SECRETS-SCAN.json` — **pass** (0 findings).

## CI billing BLOCKER (owner)
First Actions run failed in 3s with annotation:

> The job was not started because recent account payments have failed or your spending limit needs to be increased.

Run: https://github.com/sadeksobeg/rare-o/actions/runs/39391396254

**G2 cannot go green until GitHub Billing & plans is fixed** (OWNER-ACTION). After fix: re-run workflow or push a commit.
