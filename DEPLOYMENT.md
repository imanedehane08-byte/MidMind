# MidMind Deployment Guide

This file is the checklist I would follow when setting up the project locally or deploying it.

## Local Setup

Install dependencies from the root, then install each app:

```bash
npm install
cd client && npm install && cd ..
cd server && npm install && cd ..
```

Create the server environment file:

```bash
cp server/.env.example server/.env
```

For local development, the client can call `/api` directly because Vite proxies those requests to the server. You only need `client/.env` when the frontend and backend are hosted on different URLs.

Start both apps:

```bash
npm run dev
```

Local URLs:

- Client: `http://localhost:5173`
- API: `http://localhost:5050/api`

## Server Environment

Set these on the production host:

```env
NODE_ENV=production
PORT=5050
JWT_SECRET=<generate-a-long-random-secret>
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=10

ADMIN_EMAIL=<your-admin-email>
ADMIN_PASSWORD=<your-strong-admin-password>

CLIENT_ORIGIN=https://your-frontend-url.com

AI_API_KEY=<your-provider-api-key>
AI_BASE_URL=https://api.groq.com/openai/v1
AI_MODEL=llama-3.3-70b-versatile

MAX_GUIDED_INTERACTIONS=4
DB_PATH=/data/midmind.db
AUTH_RATE_LIMIT=20
SESSION_WRITE_RATE_LIMIT=100
```

Important notes:

- `JWT_SECRET` should be unique for each deployment.
- `ADMIN_EMAIL` and `ADMIN_PASSWORD` create the first admin account at server startup.
- Keep real admin credentials in the deployment platform, not in this repository.
- `CLIENT_ORIGIN` must match the public frontend URL or browser requests will fail CORS.
- `DB_PATH` should point to a persistent disk/volume in production so SQLite data survives redeploys.

## Server Deploy

Use the `server` folder as the service root.

Install command:

```bash
npm ci
```

Start command:

```bash
npm start
```

The server start script runs:

```bash
node src/index.js
```

## Client Deploy

Use the `client` folder as the service root.

If the backend is hosted separately, set:

```env
VITE_API_BASE=https://your-backend-url.com/api
```

Build command:

```bash
npm run build
```

Serve the generated `client/dist` folder with your static host.

For Nginx or another custom static server, keep a fallback to `index.html` so direct page refreshes work:

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

## Railway or Render

Create two services:

- Server service: root directory `server`
- Client service: root directory `client`

For the server, add all production environment variables from the server section.

For the client, set `VITE_API_BASE` to the public server URL ending in `/api`.
