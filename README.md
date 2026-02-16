# Dwelis Admin

Standalone admin UI for Dwelis. Deploy separately and point `admin.dwelis.com` to this app.

## Setup

```bash
cd admin
npm install
```

## Development

```bash
npm run web
```

Opens at http://localhost:8082 with **hot reload** (Fast Refresh). Changes to `app/` files update automatically.

> If you hit **EMFILE: too many open files**, use `npm run serve` instead (no hot reload; re-run after changes).

## Build for production

```bash
npm run build:web
```

Output goes to `dist/`.

## Deploy to Netlify

1. Create a new Netlify site (or use a subdomain of your existing site)
2. Connect this `admin` folder as the root (or the repo containing it)
3. Build command: `npm run build:web`
4. Publish directory: `dist`
5. Add custom domain: `admin.dwelis.com`

## Environment

- `EXPO_PUBLIC_API_URL` – Override API URL (default: from app.json, production: https://dwelis-backend.onrender.com)

## Troubleshooting

**EMFILE: too many open files** – Use the build-and-serve workflow instead:
```bash
npm run serve
```
Opens at http://localhost:8082. Re-run when you change code (no hot reload).
