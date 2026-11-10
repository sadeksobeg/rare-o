# WP1 — Skills, Tools, and Capability Readiness

Inventory of what is actually available in this Claude Code session for the RARE OUD initiative, and what each is useful for. "Available" means verified reachable this session, not assumed from documentation.

## A. Already available and used this initiative

| Capability | What it is | Verified use this session | Why it matters for RARE OUD |
|---|---|---|---|
| **Built-in browser pane** (`mcp__Claude_Browser__*`) | Chromium-based browser automation with screenshot, console/network capture, viewport emulation, form input | Logged into admin, crawled routes, captured screenshots, measured console errors, tested 390/768/1440 viewports | Only reliable way to visually verify RTL/LTR, responsive behavior, and real console errors rather than inferring from source |
| **Playwright + `@axe-core/playwright`** (project devDependencies) | Automated accessibility scanning | Ran 92-scan matrix (AR/EN × 390/1440 × storefront/admin/trader), found and fixed a real `aria-prohibited-attr` defect | Already the project's own chosen a11y tool — reuse, don't replace |
| **Lighthouse + `chrome-launcher`** (project devDependencies) | Performance/a11y/SEO lab measurement | Ran 5-run budget script, root-caused a dead LCP preload with a direct network-request trace | Already the project's own chosen perf tool |
| **Prisma** | ORM + schema/migration tooling | Read schema to verify nullable price/currency and wholesale shipping fields | Primary way to verify data-model claims without guessing |
| **`npm audit`** | Dependency vulnerability scan | Found the zod CVE and 9 dev-tool-only findings | Zero-install, zero-cost signal already wired into the project's own npm scripts (no dedicated script yet — see recommendation below) |
| **WebSearch / WebFetch** | Live web research with real URLs | Used for the WP2 design reference library (Aesop, Sharjah Art Foundation, Nazih Ghadban) | Required by this mission's explicit "verify actual URLs" instruction — no fabricated references |
| **Docs server** (`mcp__1a59c906...`) | Collaborative doc creation outside the repo | Not used — this mission asked for repo-resident, version-controlled documentation, which is a better fit for a client-owned codebase than an external doc link | N/A this phase |
| **`mcp__visualize__*`** | Inline SVG/HTML widget rendering in chat | Available for quick directional sketches during design review conversations | Useful for *fast* iteration in chat; the actual prototypes (WP4) are built as real, inspectable HTML/CSS files in-repo instead, because they need to survive the conversation and be reviewable standalone |

## B. Project's own existing tooling (already installed, already the right choice — do not replace)

| Tool | package.json entry | Status |
|---|---|---|
| Next.js 15.5 / React 19 / TypeScript 5 | `next`, `react`, `typescript` | Current, actively used |
| Tailwind CSS 4 | `tailwindcss`, `@tailwindcss/postcss` | Current |
| Prisma 6.19 / PostgreSQL 16 | `@prisma/client`, `prisma` | Current, Postgres merged (Round D2) |
| Playwright 1.49 | `@playwright/test` | Current, project's chosen E2E/a11y runner |
| Lighthouse 12.2 | `lighthouse`, `chrome-launcher`, `puppeteer-core` | Current, project's chosen perf tool. **Flagged in WP0-B4 for a version bump** (transitively vulnerable deps, low real-world risk since dev-only) |
| ESLint 9 / `eslint-config-next` | `eslint` | Current |
| `bcryptjs`, `jose` | Auth | Current, no changes recommended |
| `zod` 3.24 | Validation | **Flagged in WP0-B1** — high-severity CVE, major-version fix needs authorization |

## C. Skills available in this environment, relevant to this initiative

| Skill | Relevance | Used / recommended |
|---|---|---|
| `frontend-design` | Distinctive visual design guidance for new/reshaped UI | Consulted for WP3/WP4 — reinforces "no templated defaults," matches the project's own "not a generic luxury template" instruction |
| `artifact-design` / `artifact-diagramming` | Guidance for building reviewable Artifacts | Not used — prototypes are repo-resident HTML per this mission's "isolated, in-project" instruction, not Claude Artifacts (which would leave the repo and require a separate link to track) |
| `security-review` | Structured security review of a diff/branch | Recommended for **WP10**, once the zod migration and any other hardening changes are implemented — run before merging, not during planning |
| `code-review` | Structured code review with severity levels | Recommended for **every implementation WP (6–10)** as the quality gate before marking a work package complete |
| `21st-ui-review` / `21st-ui-build` | UI audit and build grounded in current design tokens, pulls inspiration from the 21st.dev component catalog | **Not recommended for this project.** RARE OUD's locked plan (`docs/ui-planning/plan/PLAN.md`) explicitly specifies no third-party component library and a from-scratch design language (rings/grain/axis motifs, bespoke type pairing). Pulling 21st.dev inspiration risks exactly the "generic luxury template" this mission explicitly warns against. |
| `pdf` / `docx` / `xlsx` | Document format conversion | Not relevant — all deliverables stay as versioned Markdown in-repo |
| `deep-research` | Multi-agent research synthesis | Considered for WP2, not used — the mission asked for a small number of *deeply verified* references over a large list of shallow ones; direct `WebFetch` on 3 real sites gave higher-confidence, directly-cited observations than a broad research sweep would have |

## D. MCP servers available, not used (with reason)

| Server | Reason not used |
|---|---|
| `claude-in-chrome` | Would use the operator's real, logged-in Chrome profile — unnecessary and a larger blast-radius than the sandboxed built-in browser pane for reviewing a local dev build |
| `scheduled-tasks` | No recurring job needed for a planning phase |
| `mcp-registry` (connector discovery) | No external SaaS integration is in scope for this initiative |

## E. Recommended additions — none required to produce this plan; one optional, low-risk addition for later phases

| Recommendation | Exact name / source | Purpose | Already available? | Install requirement | Compatibility/security | Safe to install? | How effectiveness is measured |
|---|---|---|---|---|---|---|---|
| Add an `npm run security:npm-audit` script wrapping `npm audit --audit-level=high` with a documented allowlist for the known dev-only findings (WP0-B4) | N/A — just a `package.json` script, no new dependency | Makes the zod-class finding (WP0-B1) show up automatically in CI/local runs instead of requiring an ad-hoc audit | Partially — `scripts/security-audit.mjs` already exists; confirm it covers `npm audit`, extend if not | Zero — scripting only | None — no new attack surface | Yes | Script exits non-zero on any new high-severity finding not on the allowlist |

No other new skill, plugin, or MCP server is recommended for this phase. The project's existing toolchain (Playwright, axe, Lighthouse, Prisma, ESLint, tsc) already covers every verification need in this plan. Adding more would violate this mission's own instruction not to install tools "simply to increase the tool count."
