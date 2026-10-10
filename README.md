# RARE OUD — Production Platform (Project B)

Client-owned musical instruments commerce platform.

## Source of truth

- `docs/week-1/*`
- `docs/week-2/*`

Not related to the separate Vision presentation prototype.

## Stack

Next.js 15 · React 19 · TypeScript · Tailwind CSS v4 · Prisma (SQLite) · Zod

## Scripts

```bash
npm install
npx prisma migrate dev
npm run db:seed
npm run dev
```

## Boundaries

- Storefront at `/`
- Admin at `/admin`
- No `/vision` route
- No WhatsApp send, trader deals, wholesale, or payments in Week 2
