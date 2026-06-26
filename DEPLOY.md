# Deployment Guide

Multi-platform serverless portfolio using Turso (serverless SQLite).

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `TURSO_DATABASE_URL` | Yes | Turso database URL |
| `TURSO_AUTH_TOKEN` | Yes | Turso auth token |
| `ADMIN_USER` | No | Admin username (default: `admin`) |
| `ADMIN_PASS` | No | Admin password (default: `demo2024`) |

## Vercel

```bash
npm i -g vercel
vercel login
vercel --prod
```

Set env vars in Vercel dashboard. Visit `/api/init` after first deploy.

## Netlify

```bash
npm i -g netlify-cli
netlify login
netlify deploy --prod
```

Set env vars in Netlify dashboard. Visit `/api/init` after first deploy.

## Local Development

```bash
# Requires Vercel CLI
vercel dev
```

Or set `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` in `.env` and use any local server.

## Initialize Database

After first deploy, visit:
```
https://your-app.vercel.app/api/init
```

## API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/projects` | No | List all projects |
| GET | `/api/services` | No | List all services |
| POST | `/api/contact` | No | Submit contact inquiry |
| GET | `/api/lookup?email=` | No | Find chat token by email |
| GET | `/api/chat/:token` | No | Get chat messages |
| POST | `/api/chat/:token` | No | Send user message |
| GET | `/api/chat/:token/unread` | No | Get unread admin messages |
| GET | `/api/admin/stats` | Basic Auth | Dashboard stats |
| GET | `/api/admin/inquiries` | Basic Auth | List all inquiries |
| PUT | `/api/admin/inquiries/:id` | Basic Auth | Update inquiry status |
| GET | `/api/admin/messages` | Basic Auth | List conversations |
| GET | `/api/admin/messages/:id` | Basic Auth | Get message thread |
| POST | `/api/admin/messages/:id` | Basic Auth | Send admin reply |
