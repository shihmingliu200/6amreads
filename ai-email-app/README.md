# 6amreads.com (AI morning newspaper)

A web app that sends subscribers a personalized “morning newspaper” by email — tailored lessons, **NewsAPI** headlines (filtered per user), **Claude** summaries, and one-tap feedback. Default send pipeline: **5:30 AM** (`CRON_SCHEDULE`). Brand: **6amreads.com**.

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Web frontend | Next.js 14 App Router + Tailwind | Landing, auth (email + Google), 7-step onboarding, dashboard, admin backstage |
| Mobile app | React Native | iOS/Android (Step 8+) |
| Backend API | Node.js + Express | Auth, profiles, preferences |
| Database | PostgreSQL | User profiles and 7 onboarding answers |
| AI content | Anthropic Claude API | 300–400 word lessons + 2–3 neutral bullets per article |
| News | NewsAPI.org | Morning pool (US/UK headlines), scored per user (hobbies, goals, role) |
| Email delivery | SendGrid | Branded HTML: lesson, news, feedback buttons, sources |
| Scheduler | node-cron | Default **`30 5 * * *`** (5:30 AM), timezone via `CRON_TIMEZONE` |
| Web hosting | Vercel | Frontend deployment |
| Backend hosting | Railway or Render | Server + cron (free tier) |

---

## Project Structure

```
ai-email-app/
├── api/                  # Node.js/Express backend
│   ├── src/
│   │   ├── index.js      # Express entry point
│   │   ├── db.js         # PostgreSQL pool
│   │   ├── middleware/
│   │   │   └── auth.js   # JWT middleware
│   │   └── routes/
│   │       ├── auth.js   # /auth/signup, /auth/login
│   │       └── profile.js# /profile/onboarding, GET /profile
│   ├── migrations/
│   │   └── 001_init.sql  # Initial DB schema
│   ├── .env.example
│   └── package.json
├── web/                  # Next.js frontend
│   ├── app/
│   │   ├── page.js           # Landing page
│   │   ├── signup/page.js    # Signup form
│   │   └── onboarding/page.js# 7-question onboarding
│   ├── .env.local.example
│   └── package.json
└── README.md
```

---

## Morning email pipeline

1. **Cron** (default 5:30 AM) runs `runDailyEmailJob`.
2. **NewsAPI** — `fetchMorningNewsPool()` pulls a shared batch of headlines (top stories, US + GB, deduped).
3. **Per user** — `selectArticlesForUser()` ranks articles by overlap with hobbies, position, goals, and bio.
4. **Claude** — `summarizeArticlesAsBullets()` turns each chosen article into **2–3 neutral bullet points** (JSON parse).
5. **Claude** — `generateLesson()` produces the **300–400 word** personalized lesson.
6. **SendGrid** — `sendDailyEmail()` sends HTML with logo, greeting, four sections, and signed **More / Less** links to `GET /public/email-feedback`.

Set **`PUBLIC_API_URL`** to your API’s public base URL so feedback links in emails resolve in production.

---

## Getting Started

### 1. Set up the database

**Option A: Supabase (free tier)**

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **Project Settings → Database** and copy the connection string (URI)
3. Use the **Transaction** pooler or **Session** pooler URL
4. Add `?sslmode=require` if not already present
5. Run the migration (use the SQL Editor in Supabase Dashboard, or):

```bash
psql "$DATABASE_URL" -f api/migrations/001_init.sql
psql "$DATABASE_URL" -f api/migrations/002_user_prefs_engagement.sql
```

**Option B: Local PostgreSQL or Railway**

```bash
psql $DATABASE_URL -f api/migrations/001_init.sql
psql $DATABASE_URL -f api/migrations/002_user_prefs_engagement.sql
```

### 2. Start the API

```bash
cd api
cp .env.example .env
# Edit .env — fill in DATABASE_URL and JWT_SECRET
npm install
npm run dev
```

API will be running at `http://localhost:3001`.

Test it:
```bash
curl http://localhost:3001/health
```

### 3. Start the frontend

```bash
cd web
cp .env.local.example .env.local
npm install
npm run dev
```

Web app will be running at `http://localhost:3000`.

---

## Environment Variables

### api/.env

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret for signing JWTs (use a long random string) |
| `PORT` | Port for the API server (default: 3001) |
| `ADMIN_SECRET` | Secret for backstage admin (X-Admin-Key header) |
| `SENDGRID_API_KEY` | SendGrid API key for sending emails |
| `FROM_EMAIL` | Sender email (must be verified in SendGrid) |
| `FROM_NAME` | Sender name (default: Morning Paper) |
| `APP_URL` | App URL for links in emails (default: http://localhost:3000) |
| `CRON_SCHEDULE` | Cron expression (default: 5:30 AM daily) |
| `PUBLIC_API_URL` | Public API URL for in-email feedback links |
| `ANTHROPIC_MODEL` | Optional Claude model id |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID (for `POST /auth/google`) |

### web/.env.local

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | URL of the backend API (default: http://localhost:3001) |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth Web Client ID (optional; must match API `GOOGLE_CLIENT_ID`) |

---

## Backstage (Admin)

Visit `/backstage` to access the admin panel. Enter your `ADMIN_SECRET` as the admin key.

- **Dashboard**: Users, emails sent today (UTC), open-rate stats (when `opened_at` is populated), revenue placeholders, cron/system status, member table
- **Member detail**: Full profile, email history, **edit** or **delete** user
- **Send emails now**: Runs the same job as cron (`runDailyEmailJob`)

---

## API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | /health | No | Health check |
| POST | /auth/signup | No | Create account |
| POST | /auth/login | No | Log in, get JWT |
| POST | /auth/google | No | Google ID token → JWT |
| POST | /profile/onboarding | Yes | Save 7 onboarding answers |
| GET | /profile | Yes | Get user profile + prefs |
| PATCH | /profile | Yes | Update answers, timezone, delivery hour, paused, feedback |
| GET | /admin/stats | Admin | Extended stats + revenue placeholder |
| GET | /admin/status | Admin | Cron heartbeat + last email sent |
| GET | /admin/members | Admin | List all members |
| GET | /admin/members/:id | Admin | Member detail + email history |
| PATCH | /admin/members/:id | Admin | Edit member |
| DELETE | /admin/members/:id | Admin | Delete member |
| POST | /admin/trigger-emails | Admin | Run daily email job |
| GET | /public/email-feedback | No | One-tap email feedback (`u`, `c`, `s` query params) |

---

## Build Roadmap

- [x] **Step 1** — Plan tech stack
- [x] **Step 2** — Onboarding form (web)
- [x] **Step 3** — Database schema + API
- [ ] **Step 4** — AI content generator (Claude API)
- [ ] **Step 5** — News fetcher (NewsAPI.org)
- [ ] **Step 6** — HTML email template (SendGrid)
- [ ] **Step 7** — Daily cron job (node-cron, 6 AM per user timezone)
- [x] **Step 8** — User dashboard (profile, preview, edit answers, delivery time, pause, feedback)
- [ ] **Step 9** — Feedback loop (email link → DB → adjusts next Claude prompt)
- [ ] **Step 10** — Deploy (Vercel + Railway)

---

## API Keys You'll Need

1. **Anthropic Claude API** — https://console.anthropic.com
2. **NewsAPI.org** — https://newsapi.org (free: 100 req/day)
3. **SendGrid** — https://sendgrid.com (free: 100 emails/day)
4. **PostgreSQL** — Railway or Supabase (free tier available)
