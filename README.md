# NoteVault — AI-Powered Smart Notes Management App

A full-stack, SaaS-style note management application where notes are more than plain text — AI automatically generates titles, summarizes long content, and lets you **chat with your own notes** using Retrieval-Augmented Generation (RAG), automatically detects reminders and deadlines, surfaces semantically related notes, and lets you merge notes intelligently.

Built with the MERN stack (MongoDB, Express, React, Node.js), Redux Toolkit, Google Gemini, ChromaDB,Redis and BullMQ.

**Live:** https://notevault-pro.vercel.app

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Folder Structure](#folder-structure)
- [Local Setup](#local-setup)
- [Environment Variables](#environment-variables)
- [External Services Required](#external-services-required)
- [Deployment](#deployment)
- [Scripts](#scripts)
- [Known Limitations](#known-limitations)

---

## Features

### Notes Management

- Create, edit, delete notes — title is completely optional
- Pin, archive, trash, and restore notes
- Flat **labels** (not folders) for cross-cutting organization
- Multi-select with bulk pin / archive / delete / restore
- Duplicate a note ("Make a copy")
- Copy note content to clipboard
- Keyword search with live text highlighting (multi-word, order-independent)
- Two-column grid on mobile, three-column on desktop — pinned notes always shown first

### AI Features (Google Gemini)

- **AI Title Generation** — one-click title suggestion based on note content
- **AI Summarization** — on-demand summary for any note, with regenerate option
- **Semantic Embeddings** — every note is embedded in the background (BullMQ + Redis) and stored in ChromaDB
- **RAG Chat** — a slide-in chat panel that answers questions across all your notes using retrieved context, with source note references
- **Related Notes** — opens automatically inside the note editor showing 3-4 semantically similar notes as horizontally scrollable mini-cards; clicking one instantly swaps the editor to that note — a "second brain" experience with no manual linking required
- **Smart Reminder Extraction** — background job automatically detects dates, deadlines, meetings, and time-sensitive tasks from note content ("Meet John on Friday", "Submit report by 5th") and surfaces them as amber bell chips on the note card
- **Note Merging** — select 2+ notes, click Merge → instantly concatenates into one note with `--- Section ---` headings, auto-generates an AI title, and opens the editor. Optional **"Organize with AI"** button inside the merged note reorganizes content by topic/theme instead of by original note — preserving every fact, just structured better
- **Organize with AI** — available on any merged note; Gemini intelligently reorganizes the content without losing any information; gracefully falls back on Gemini 503 errors with the original content unchanged

### Authentication & Account

- JWT authentication with **access token (in-memory) + rotating refresh token (httpOnly cookie)**
- Email/password registration and login with strict validation
- **Google OAuth 2.0** sign-in/sign-up (via Passport.js)
- Account linking — same email via Google or password logs into the same account
- **Set Password** flow for Google-only users who want email login too
- **Change Password** flow for existing password users
- **Forgot / Reset Password** via email (Resend)
- Editable profile (display name, avatar color)
- Rate-limited auth endpoints (brute-force protection)

### Smart Reminders
- Extracted automatically in the background after every note save — no user action needed
- Amber bell chips appear on note cards with reminder text and datetime
- Clicking a chip opens a popover with full actions:
  - **Got it** — marks as acknowledged (chip goes strikethrough/muted)
  - **Undo** — reverts an accidental acknowledgment back to active
  - **Remove** — permanently deletes the reminder from the note
- Duplicate-detection prevents the same reminder being extracted twice on subsequent saves

### Note Merging
- Select 2 or more notes using multi-select checkboxes
- Click **Merge** in the selection navbar — notes concatenated instantly, AI title auto-generated, editor opens
- **Organize with AI** button (shown only on merged notes) — Gemini restructures content by theme, removes `--- Section ---` markers, de-duplicates overlapping points
- Retry logic handles Gemini 503 (overload) errors — up to 2 retries with exponential backoff before graceful failure
- On failure, original merged content is preserved exactly — nothing is ever lost

### SaaS-Grade UI/UX

- Professional design system: custom color tokens, Sora (display) + Inter (body) + JetBrains Mono (AI metadata) typography
- Full light/dark mode
- Collapsible desktop sidebar + mobile drawer navigation
- Toast notifications (Sonner) for every action
- Context-aware empty states for every view (All / Pinned / Archive / Trash / Label / Search)
- Confirmation dialogs for destructive actions (permanent delete)
- Error boundary to prevent full-app crashes
- 404 page with navigation back to notes
- Fully responsive (mobile, tablet, desktop)

---

## Tech Stack

| Layer                        | Technology                                                                                                    |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Frontend                     | React (Vite), Redux Toolkit + RTK Query, React Router, Tailwind CSS, shadcn/ui, react-hook-form + Zod, Sonner |
| Backend                      | Node.js, Express                                                                                              |
| Database                     | MongoDB (Mongoose)                                                                                            |
| Auth                         | JWT (access + refresh), Passport.js (Google OAuth 2.0), bcrypt                                                |
| AI (generation + embeddings) | Google Gemini API (`gemini-3.6-flash` for generation, `gemini-embedding-001` for embeddings)               |
| Vector Database              | ChromaDB (local via Docker in dev, Chroma Cloud in production)                                                |
| Background Jobs              | BullMQ + Redis (local via Docker in dev, Upstash Redis in production)                                         |
| Transactional Email          | Resend                                                                                                        |
| Deployment                   | Vercel (frontend), Render (backend)                                                                           |

---

## Architecture

```
┌──────────────┐        ┌──────────────┐        ┌──────────────┐
│   React      │◄──────►│   Express    │◄──────►│  MongoDB     │
│ Redux Toolkit│        │   API Layer  │        │  Atlas       │
│  (Vercel)    │        │   (Render)   │        │              │
└──────────────┘        └──────┬───────┘        └──────────────┘
       ▲                       │
       │ /api/* proxy          │
       │ (same-origin cookie)  │
       └───────────────────────┘
                                │
                    ┌───────────┴────────────┐
                    │  BullMQ + Upstash Redis │
                    │  Job types:             │
                    │  • embed-note           │
                    │  • extract-reminders    │
                    └───────────┬────────────┘
                                │
                    ┌───────────┴────────────┐
                    │  Google Gemini API      │
                    │  • Text generation      │
                    │  • Embeddings           │
                    └───────────┬────────────┘
                                │
                    ┌───────────┴────────────┐
                    │  ChromaDB (Chroma Cloud)│
                    │  • Semantic memory      │
                    │  • RAG retrieval        │
                    │  • Related notes        │
                    └────────────────────────┘
```

**Request flow for AI features:**

- **Title / Summary / Organize** — synchronous → Gemini → response (user is actively waiting, 1-2s acceptable)
- **Embeddings + Reminder extraction** — BullMQ job queued on every note save; background worker processes silently; user never waits
- **RAG Chat** — the question is embedded, ChromaDB returns the most relevant notes, their content is passed as context to Gemini, which generates a grounded answer with source references.
- **Related Notes** — reuses stored note embedding from ChromaDB (no extra Gemini call) → nearest neighbors queried → shown in editor
- **Cookie security** — refresh token is httpOnly + Secure + SameSite=Lax; all API calls proxied through Vercel so cookie is always first-party regardless of browser third-party cookie blocking

---

## Folder Structure

```
notes-ai/
├── backend/
│   ├── src/
│   │   ├── config/          # db, redis, chroma, gemini, passport
│   │   ├── models/          # User, Note (Mongoose schemas)
│   │   ├── controllers/     # auth, note, ai controllers
│   │   ├── routes/          # auth, note, ai routes
│   │   ├── middleware/      # auth (protect), error handling
│   │   ├── queues/          # BullMQ queue (embed-note + extract-reminders) + worker
│   │   ├── utils/           # token generation, embeddings, email
│   │   └── app.js           # Express app (middleware, routes)
│   ├── server.js            # Entry point (loads env, connects DB/Redis, starts server + worker)
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── app/              # Redux store
│   │   ├── features/         # auth, notes, theme, selection, ai (RTK Query slices)
│   │   ├── services/         # base RTK Query API (with token refresh interceptor)
│   │   ├── components/       # layout, notes, chat, ui (shadcn)
│   │   ├── pages/             # Login, Register, Dashboard, Settings, etc.
│   │   ├── routes/           # ProtectedRoute
│   │   ├── lib/              # validation schemas (Zod), utils (formatRetryTime, highlightText)
│   │   └── App.jsx
│   ├── vercel.json           # SPA rewrites + API proxy to backend
│   └── package.json
│
└── README.md
```

---

## Local Setup

### Prerequisites

- Node.js 18+
- Docker Desktop (for local Redis + ChromaDB)
- A MongoDB Atlas account (free tier)
- A Google Gemini API key (free tier)

### 1. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/notes-ai.git
cd notes-ai

cd backend && npm install
cd ../frontend && npm install
```

### 2. Start local infrastructure (Docker)

```bash
docker run -d --name redis -p 6379:6379 redis:alpine
docker run -d --name chromadb -p 8000:8000 -v chroma-data:/chroma/chroma chromadb/chroma:latest
```

### 3. Configure environment variables

Copy the example files and fill in your own values (see [Environment Variables](#environment-variables) below):

```bash
cd backend
cp .env.example .env
```

```bash
cd frontend
cp .env.example .env
```

### 4. Run the app

```bash
# Terminal 1 — backend
cd backend
npm run dev

# Terminal 2 — frontend
cd frontend
npm run dev
```

- Backend: `http://localhost:5000`
- Frontend: `http://localhost:5173`

---

## Environment Variables

### Backend (`backend/.env`)

```env
# Server
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# MongoDB
MONGO_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/notes-ai-saas

# JWT
JWT_ACCESS_SECRET=long_random_string
JWT_REFRESH_SECRET=different_long_random_string
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

# Google Gemini
GEMINI_API_KEY=your_gemini_api_key
GEMINI_EMBEDDING_MODEL=gemini-embedding-001

# Redis (local Docker in dev, Upstash in prod)
REDIS_URL=redis://localhost:6379

# ChromaDB — local dev
CHROMA_URL=http://localhost:8000
CHROMA_COLLECTION=notes

# ChromaDB — production (Chroma Cloud)
CHROMA_HOST=api.trychroma.com
CHROMA_TENANT=your-tenant-id
CHROMA_DATABASE=your-database-name
CHROMA_API_KEY=your-chroma-cloud-api-key

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# Resend (transactional email)
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=NoteVault <onboarding@resend.dev>
RESET_PASSWORD_URL=http://localhost:5173/reset-password
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:5000/api
```

> In production, this is set to a relative `/api` path and proxied through Vercel to the Render backend — see [Deployment](#deployment).

---

## External Services Required

All services below have a **free tier** sufficient for development and a small-scale production deployment.

| Service              | Purpose                                  | Sign up                                      |
| -------------------- | ---------------------------------------- | -------------------------------------------- |
| MongoDB Atlas        | Primary database                         | https://www.mongodb.com/cloud/atlas/register |
| Google AI Studio     | Gemini API key (generation + embeddings) | https://aistudio.google.com/app/apikey       |
| Google Cloud Console | OAuth 2.0 credentials                    | https://console.cloud.google.com             |
| Chroma Cloud         | Managed vector database (production)     | https://trychroma.com                        |
| Upstash              | Managed Redis (production)               | https://upstash.com                          |
| Resend               | Transactional email (password reset)     | https://resend.com                           |
| Render               | Backend hosting                          | https://render.com                           |
| Vercel               | Frontend hosting                         | https://vercel.com                           |

---

## Deployment

### Overview

```
Frontend  → Vercel
Backend   → Render
Database  → MongoDB Atlas (M0 free tier)
Vectors   → Chroma Cloud
Queue     → Upstash Redis
Email     → Resend
AI        → Google Gemini API
```

### Backend (Render)

1. Push code to GitHub.
2. Create a **Web Service** on Render, connect the repo.
3. Set **Root Directory** to `backend`.
4. Build command: `npm install` · Start command: `node server.js`.
5. Add all backend environment variables (production values — see above).
6. Set `app.set("trust proxy", 1)` is already configured to work correctly behind Render's reverse proxy.
7. In MongoDB Atlas → Network Access → allow `0.0.0.0/0` so Render can connect.

### Frontend (Vercel)

1. Import the repo into Vercel, set **Root Directory** to `frontend`.
2. Framework preset: Vite. Build command: `npm run build`. Output: `dist`.
3. Set `VITE_API_URL=/api` (relative — see proxy note below).
4. Add `frontend/vercel.json` with API proxy + SPA rewrites:

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://YOUR-RENDER-URL.onrender.com/api/:path*"
    },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

> **Why the proxy is required:** the frontend and backend are on different domains. Routing `/api/*` through Vercel makes the refresh-token cookie **first-party** instead of third-party — this is what allows the cookie to be set reliably even with browsers that block third-party cookies by default. Cookies are configured as `httpOnly`, `secure`, `SameSite=Lax`.

### Google OAuth (production)

Add your production callback URL to **Google Cloud Console → Credentials → Authorized redirect URIs**:

```
https://YOUR-RENDER-URL.onrender.com/api/auth/google/callback
```

Update `GOOGLE_CALLBACK_URL` and `CLIENT_URL` on Render accordingly.

### Chroma Cloud (production vector DB)

Create a database + collection on Chroma Cloud, then set `CHROMA_HOST`, `CHROMA_TENANT`, `CHROMA_DATABASE`, `CHROMA_API_KEY` on Render. The client automatically switches between local Docker ChromaDB (dev) and Chroma Cloud (`NODE_ENV=production`) — see `backend/src/config/chroma.js`.

### Upstash Redis (production queue)

Create a Redis database on Upstash, copy the `rediss://` connection string (note the double `s` — TLS required) into `REDIS_URL` on Render.

---

## Scripts

| Command         | Location | Description                                          |
| --------------- | -------- | ---------------------------------------------------- |
| `npm run dev`   | backend  | Start Express server with nodemon + embedding worker |
| `npm run dev`   | frontend | Start Vite dev server                                |
| `npm run build` | frontend | Production build                                     |

---
 
## API Overview
 
| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/register` | Register with email/password |
| POST | `/api/auth/login` | Login with email/password |
| POST | `/api/auth/refresh` | Refresh access token via cookie |
| POST | `/api/auth/logout` | Logout, invalidate refresh token |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/auth/google` | Initiate Google OAuth |
| GET | `/api/auth/google/callback` | Google OAuth callback |
| PATCH | `/api/auth/set-password` | Set password for Google-only account |
| PATCH | `/api/auth/change-password` | Change existing password |
| PATCH | `/api/auth/update-profile` | Update name / avatar color |
| POST | `/api/auth/forgot-password` | Send password reset email |
| POST | `/api/auth/reset-password` | Reset password with token |
| GET | `/api/notes` | Get all notes (with filters) |
| POST | `/api/notes` | Create note |
| PUT | `/api/notes/:id` | Update note |
| DELETE | `/api/notes/:id` | Trash note |
| POST | `/api/notes/merge` | Merge multiple notes into one |
| GET | `/api/notes/:id/related` | Get semantically related notes |
| PATCH | `/api/notes/:id/pin` | Toggle pin |
| PATCH | `/api/notes/:id/archive` | Toggle archive |
| PATCH | `/api/notes/:id/restore` | Restore from trash |
| DELETE | `/api/notes/:id/permanent` | Delete forever |
| POST | `/api/notes/:id/copy` | Duplicate note |
| PATCH | `/api/notes/:id/reminders/:rid/acknowledge` | Acknowledge reminder |
| PATCH | `/api/notes/:id/reminders/:rid/unacknowledge` | Undo acknowledgment |
| DELETE | `/api/notes/:id/reminders/:rid` | Remove reminder permanently |
| POST | `/api/ai/generate-title` | Generate title with Gemini |
| POST | `/api/ai/summarize` | Summarize note with Gemini |
| POST | `/api/ai/organize` | Organize merged note content with Gemini |
| POST | `/api/ai/chat` | RAG chat — answer questions from notes |

---

## Known Limitations

- **Free-tier latency** — Render, Atlas M0, Upstash, and Chroma Cloud are shared infrastructure. Expect 400ms–1.5s per request (cross-region hops) and up to 15s cold-start if the Render instance was idle. Use a keep-alive ping service (cron-job.org) to mitigate cold starts.
- **Email validation** — format and domain-length checks only; no email verification step. A real email is not enforced at the code level.
- **Reminder datetime parsing** — Gemini returns the datetime string exactly as written in the note ("Friday", "by 5th") — no normalization to actual Date objects, so no calendar integration or push notifications yet.
- **Google OAuth on free tier Gemini** — model availability varies by Google Cloud project. If `gemini-3.6-flash` becomes unavailable, update `GEMINI_EMBEDDING_MODEL` and the default in `gemini.js`. A model-discovery script is included in the repo.
- **Semantic search removed from main search** — the search bar uses client-side keyword matching (fast, predictable, Keep-style). Semantic/vector search is used only in RAG chat and Related Notes where it provides genuine value over keyword matching.

---

## Author

Meet Vora

- Email: meetvora877@gmail.com
- LinkedIn: https://linkedin.com/in/meetvora79
