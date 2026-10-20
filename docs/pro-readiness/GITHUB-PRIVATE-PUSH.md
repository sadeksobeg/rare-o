# Push this repo to a private GitHub repository

Use this checklist once to enable GitHub Actions CI (F1 proof pipeline) on a private remote. Values marked **test-only** are safe for CI secrets documentation — replace with production credentials before go-live.

## 1. Create a private repository on GitHub

1. Sign in to [GitHub](https://github.com).
2. **New repository** → name e.g. `rare-oud-platform`.
3. Visibility: **Private**.
4. Do **not** initialize with a README (this tree already has history).
5. Create the repository and copy the HTTPS or SSH URL (e.g. `git@github.com:ORG/rare-oud-platform.git`).

## 2. Add the remote (local machine)

From the project root:

```bash
git remote add origin git@github.com:YOUR_ORG/rare-oud-platform.git
git branch -M main
git push -u origin main
```

If you use HTTPS:

```bash
git remote add origin https://github.com/YOUR_ORG/rare-oud-platform.git
git push -u origin main
```

## 3. Confirm CI runs

1. Open **Actions** on the repository.
2. The **CI** workflow (`.github/workflows/ci.yml`) should run on the push.
3. Artifacts: `playwright-report`, `lighthouse-report` (when generated).

Optional: **Actions → CI → Run workflow** runs `workflow_dispatch` (includes the manual Caddy job that expects an app on `:3000`).

## 4. Repository secrets (Settings → Secrets and variables → Actions)

Add **Repository secrets** for production deploys and parity with local `.env`. For **CI-only** proof on GitHub-hosted runners, the workflow already sets test values in `ci.yml`; you only need secrets below if you extend deploy jobs or override defaults.

| Secret | Purpose | Test-only example (CI docs) |
|--------|---------|-----------------------------|
| `DATABASE_URL` | Postgres connection string | `postgresql://rareoud:rareoud@localhost:5432/rareoud?schema=public` |
| `AUTH_SECRET` | Session signing (min 16 chars) | `ci-auth-secret-min-16-chars` |
| `ADMIN_EMAIL` | Seed admin login | `admin@rareoud.local` |
| `ADMIN_PASSWORD` | Seed admin password | `ChangeMeNow!` |
| `TRADER_EMAIL` | Seed trader login | `trader@rareoud.local` |
| `TRADER_PASSWORD` | Seed trader password | `ChangeMeNow!` |
| `WHATSAPP_BUSINESS_E164` | WA business line E.164 | `963900000000` |

**Do not commit** real passwords, production `DATABASE_URL`, or API keys. Rotate any **test-only** values if they were ever used outside isolated CI.

## 5. Optional: branch protection

- Require the **CI** check before merging to `main`.
- Require pull request reviews for production branches.

## 6. What F1 CI proves after push

- Lint, TypeScript, Prisma migrate, unit checks, week3 regression, production build.
- Playwright **all projects**, **three** consecutive full runs.
- Lighthouse budget script (5 runs; job soft-fails until F2 hard gate).
- Docker image build with `NPM_REGISTRY=https://registry.npmjs.org`.
- `npm run security:audit` fails on **high** / **critical**.
- Caddy **tls internal** smoke via `scripts/ci-caddy-smoke.sh`.

Until a remote exists, verification rows stay **BLOCKED** in `ROUND-F-VERIFICATION.md` with “workflow prepared”.
