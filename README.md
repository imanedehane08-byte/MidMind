# MidMind — Guidance-First AI Learning Assistant

MidMind is a web app that makes you earn the answer. Instead of giving instant solutions, it guides you through hints, collects your attempts, and only reveals the full explanation once you have genuinely tried. The goal is active learning over passive copying.

---

## How It Works

1. **You ask a question** — anything you want to understand.
2. **The AI gives you a hint** — a Socratic nudge, never the answer.
3. **You write an attempt** — your best reasoning, right or wrong.
4. **You get feedback** — the AI evaluates your thinking.
5. **Repeat** — up to 5 rounds of hints and attempts.
6. **The solution is revealed** — once you answer correctly or exhaust your attempts.

You can also click **Show answer** after at least 2 real attempts if you are genuinely stuck.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Wouter |
| Backend | Node.js, Express |
| Database | SQLite (via better-sqlite3) |
| Auth | JWT + bcrypt |
| AI | OpenAI-compatible API (Groq, Gemini, OpenAI, OpenRouter) |

---

## Project Structure

```
midmind_fixed/
├── client/                  # React frontend
│   └── src/
│       ├── pages/           # home, history, session-detail, login, register, admin
│       ├── components/      # Layout, ProtectedRoute, AdminRoute
│       ├── context/         # AuthContext, DarkModeContext
│       └── lib/             # API client and shared types
├── server/                  # Express backend (MVC architecture)
│   └── src/
│       ├── models/          # Model — SQLite schema, queries, admin seed
│       ├── controllers/     # Controller — business logic per domain
│       ├── routes/          # Router — thin URL-to-controller mappings
│       ├── services/        # AI integration (tutor, evaluator, solution writer)
│       └── middleware/      # JWT auth guard
└── package.json             # Root dev script — runs both apps together
```

### Server MVC Layers

| Layer | Folder | Responsibility |
|---|---|---|
| Model | `server/src/models/` | Database schema, all SQL queries (`db.js`), admin account seed (`store.js`) |
| Controller | `server/src/controllers/` | Business logic — validates input, calls models and services, builds responses |
| Router | `server/src/routes/` | Maps HTTP endpoints to middleware and controller functions only |

---

## Setup

### 1. Install dependencies

From the project root:

```bash
npm install
cd client && npm install && cd ..
cd server && npm install && cd ..
```

### 2. Configure the server

```bash
cp server/.env.example server/.env
```

Open `server/.env` and fill in the required values. The values below are examples only; keep your real secrets in `server/.env`, not in this README or in GitHub.

```env
JWT_SECRET=replace-with-a-long-random-string
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your-admin-password

# Frontend URL allowed by CORS
CLIENT_ORIGIN=http://localhost:5173

# AI provider example
AI_API_KEY=your-api-key
AI_BASE_URL=https://api.groq.com/openai/v1
AI_MODEL=llama-3.3-70b-versatile
```

### 3. Run the app

```bash
npm run dev
```

- Frontend: http://localhost:5173
- API: http://localhost:5050/api

---

## Features

- **Guided learning flow** — hint → attempt → feedback loop enforced by the backend
- **Anti-gaming system** — detects keyboard mash, single words, gibberish, and give-up phrases
- **Give-up button** — available after 2 real attempts, requires confirmation
- **Session history** — full replay of every hint and attempt with timestamps
- **Stats dashboard** — completion rate, average hints and attempts per session
- **Admin dashboard** — monitor all users, sessions, and platform-wide learning stats
- **Dark mode** — persisted via localStorage
- **Rate limiting** — protects auth and session creation endpoints

---

## Automated Test

The backend includes a unit test for AI quota-error detection.

Test file:

```txt
server/src/services/ai.test.js
```

Run it with:

```bash
cd server
npm test
```

Expected result:

```txt
2 tests passed
```

---

## User Roles

| Role | Access |
|---|---|
| Student | Own sessions and history |
| Admin | All sessions, all users, global stats |

The admin account is created automatically on first server start using `ADMIN_EMAIL` and `ADMIN_PASSWORD` from the environment file.
