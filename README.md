# MatriGuard Dashboard

Admin panel for the MatriGuard website's blog. One admin signs in, writes and
publishes posts; the website reads published posts from this app's public API.

Runs as its own Hostinger Node.js Web App, separate from the website, so a
crash or redeploy here never takes the public site down.

## Data

Everything lives in MySQL: posts in `posts`, uploaded images in `media`
(a Node.js Web App's folder can be replaced on redeploy, so nothing is kept
on disk). One phpMyAdmin export backs up the whole blog.

## First-time database setup (phpMyAdmin)

1. hPanel > Databases > phpMyAdmin > open `u319046606_matriguard_db`.
2. SQL tab: paste `db/schema.sql`, press Go.
3. SQL tab: paste `db/seed.sql`, press Go. (The ten existing articles;
   their bodies are only the excerpt and need writing in the editor.)

Both files are safe to run twice.

## Local setup

```bash
npm install
cp .env.example .env.local
node scripts/hash-password.mjs "a-long-password"   # paste both lines into .env.local
npm run dev -- -p 3001
```

The Hostinger database only accepts connections from the server. To use it
from your computer, add your IP under hPanel > Databases > Remote MySQL and
set `DB_HOST` to the hostname shown there; or point `DB_*` at a local MySQL.

## Public API (read by the website)

| Request | Returns |
| --- | --- |
| `GET /api/public/posts` | `{ posts: [...] }` live posts, newest first, no bodies |
| `GET /api/public/posts/<slug>` | `{ post: {...} }` with `contentHtml`, or 404 |
| `GET /uploads/<name>` | an uploaded image |

Only posts that are published and dated today or earlier (India time) are
returned. Responses may be cached for 60 seconds.

## Production (Hostinger Node.js Web App)

- Build command `npm run build`, start command `npm start`.
- Environment variables: everything in `.env.example`, with `DB_HOST=127.0.0.1`.
- Rotating `SESSION_SECRET` signs every session out.
