# Dwelis Admin

Standalone **admin dashboard** for Dwelis operations: listing moderation, host verification, reservations, and finance. Deployed separately from the main guest/host app.

Production: `https://admin.dwelis.com`

## Stack

- **Expo 51** (web-focused)
- **React Navigation**
- **Axios** → Dwelis API (`EXPO_PUBLIC_API_URL`)

## Prerequisites

- Node.js **18+**
- Backend API running (local or production)
- Admin user account (role `admin` in the database)

## Setup

```bash
cd admin
npm install
npm run web
```

Opens at **http://localhost:8082** with hot reload.

Point at a local API:

```bash
EXPO_PUBLIC_API_URL=http://localhost:4001 npm run web
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run web` | Dev server (port 8082) |
| `npm run start:web` | Same, without file-watcher wrapper |
| `npm run build:web` | Static export to `dist/` |
| `npm run serve` | Serve `dist/` locally (no hot reload) |
| `npm run build-and-serve` | Build + serve against localhost API |

## Environment

| Variable | Purpose |
|----------|---------|
| `EXPO_PUBLIC_API_URL` | API base URL (default from `app.json`: `https://api.dwelis.com`) |

## Deploy

### Netlify

1. Connect repo; set **root directory** to `admin`
2. **Build command:** `npm run build:web`
3. **Publish directory:** `dist`
4. **Custom domain:** `admin.dwelis.com`
5. Set `EXPO_PUBLIC_API_URL=https://api.dwelis.com` in Netlify env if needed

### Other static hosts

Run `npm run build:web` and upload `dist/`.

## Troubleshooting

**EMFILE: too many open files** on macOS — use production-style serve instead of dev:

```bash
npm run build-and-serve
```

Re-run after code changes (no Fast Refresh).

## Related

- API admin routes: see `backend/README.md` (`/admin/*`)
- Main marketplace app: `../dwelis-frontend`
