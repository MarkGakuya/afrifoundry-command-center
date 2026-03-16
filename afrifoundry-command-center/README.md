# AfriFoundry Command Center

Internal mission control for AfriFoundry. Runs at `command.afrifoundry.com`.

**Not a public product. Internal only.**

---

## What's inside

- **Bridge** — System health, platform metrics, live activity feed, quick actions
- **Intelligence** — Scraper grid, data pipeline, review queue (approve/reject)
- **Product** — AfriFoundry AI metrics, conversation types, quality scores
- **Scouts** — Field network map, scout stats, sync feed
- **Company** — Milestones, revenue, full funding pipeline
- **Users** — User table, role management

## Stack

- Next.js 14 (App Router)
- Tailwind CSS
- Recharts (charts)
- jose (JWT auth)
- Hosted on Vercel

## Deploy to Vercel (5 minutes)

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "AfriFoundry Command Center v1"
git remote add origin https://github.com/MarkGakuya/afrifoundry-command-center.git
git push -u origin main
```

### 2. Connect to Vercel

1. Go to [vercel.com](https://vercel.com) → New Project
2. Import `afrifoundry-command-center` from GitHub
3. Framework: **Next.js** (auto-detected)
4. Add environment variables (see step 3)
5. Deploy

### 3. Set environment variables in Vercel

Go to Project → Settings → Environment Variables and add:

| Key | Value |
|-----|-------|
| `JWT_SECRET` | A strong random string (generate at random.org) |
| `ADMIN_EMAIL` | `mark@afrifoundry.com` |
| `ADMIN_PASSWORD` | Your secure password |
| `API_BASE` | `https://afrifoundry-api.onrender.com` |
| `API_TOKEN` | Your AfriFoundry API admin token |

### 4. Set custom domain

Vercel → Project → Settings → Domains → Add `command.afrifoundry.com`

Add a CNAME record in your DNS:
```
CNAME  command  cname.vercel-dns.com
```

Done. Live at `command.afrifoundry.com`.

---

## Local development

```bash
# 1. Install
npm install

# 2. Set up env
cp .env.example .env.local
# Fill in .env.local with your values

# 3. Run
npm run dev
# → http://localhost:3000
```

## How auth works

1. You submit email/password on `/login`
2. Next.js API route calls AfriFoundry API (or falls back to env-based admin)
3. Signs a JWT and sets it as an httpOnly cookie — never visible in browser
4. All API calls go through `/api/proxy/[...path]` — backend token never in browser
5. Middleware checks the JWT on every page load and enforces role-based routing

## Role access

| Role | Pages |
|------|-------|
| admin | All 6 tabs |
| data | Intelligence only |
| scout | Scouts only |
| product | Product only |

## Fallback data

All 6 pages have realistic mock data built in. If the API is unreachable (Render cold start, etc.), the Command Center still loads and shows mock data so you're never blind.

---

*AfriFoundry · Building the 98% · March 2026*
