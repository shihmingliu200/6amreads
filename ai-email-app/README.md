# AI Personalized Email App

A web app that sends users a custom morning email every day — personalized lessons tied to their goals, relevant world news, and sources.

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Web frontend | React + Next.js | Website: signup, onboarding, dashboard |
| Mobile app | React Native | iOS/Android (Step 8+) |
| Backend API | Node.js + Express | Auth, profiles, preferences |
| Database | PostgreSQL | User profiles and 7 onboarding answers |
| AI content | Anthropic Claude API | Generates personalized daily lessons |
| News | NewsAPI.org | Fetches real-world news each morning |
| Email delivery | SendGrid | Sends the daily email |
| Scheduler | node-cron | Runs every morning at 6 AM |
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

## Getting Started

### 1. Set up the database

Create a PostgreSQL database (Railway, Supabase, or local). Then run the migration:

```bash
psql $DATABASE_URL -f api/migrations/001_init.sql
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

### web/.env.local

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | URL of the backend API (default: http://localhost:3001) |

---

## API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | /health | No | Health check |
| POST | /auth/signup | No | Create account |
| POST | /auth/login | No | Log in, get JWT |
| POST | /profile/onboarding | Yes | Save 7 onboarding answers |
| GET | /profile | Yes | Get user profile |

---

## Build Roadmap

- [x] **Step 1** — Plan tech stack
- [x] **Step 2** — Onboarding form (web)
- [x] **Step 3** — Database schema + API
- [ ] **Step 4** — AI content generator (Claude API)
- [ ] **Step 5** — News fetcher (NewsAPI.org)
- [ ] **Step 6** — HTML email template (SendGrid)
- [ ] **Step 7** — Daily cron job (node-cron, 6 AM per user timezone)
- [ ] **Step 8** — User dashboard (view/edit profile, past emails, pause delivery)
- [ ] **Step 9** — Feedback loop (email link → DB → adjusts next Claude prompt)
- [ ] **Step 10** — Deploy (Vercel + Railway)

---

## API Keys You'll Need

1. **Anthropic Claude API** — https://console.anthropic.com
2. **NewsAPI.org** — https://newsapi.org (free: 100 req/day)
3. **SendGrid** — https://sendgrid.com (free: 100 emails/day)
4. **PostgreSQL** — Railway or Supabase (free tier available)
