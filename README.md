# MatriGuard Dashboard

Admin panel for the MatriGuard website's blog. One admin signs in, writes and
publishes posts; the website reads published posts from this app's API.

Runs as its own process, separate from the website, so a crash or redeploy
here never takes the public site down.

## Local setup

```bash
npm install
cp .env.example .env.local
node scripts/hash-password.mjs "a-long-password"   # paste both lines into .env.local
npm run dev -- -p 3001
```

Open http://localhost:3001 and sign in with `ADMIN_EMAIL` and that password.

On first run the ten articles the website already listed are seeded into
`data/posts.json`. Their bodies are only the excerpt; write the full text in
the editor.

## Where content lives

| What        | Where                          |
| ----------- | ------------------------------ |
| Posts       | `$DATA_DIR/posts.json`         |
| Images      | `$DATA_DIR/uploads/`           |

`DATA_DIR` defaults to `./data` (gitignored). In production point it outside
the app folder, e.g. `/var/lib/matriguard-dashboard`, and include it in backups.

## Production

```bash
npm ci && npm run build
pm2 start npm --name matriguard-dashboard -- start -- -p 3001
```

Put it behind nginx on its own subdomain (e.g. `admin.matriguardsolutions.com`)
with HTTPS; the session cookie is `Secure` in production. Pass the client IP
through with `proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;` so
the login throttle counts per visitor.

Rotating `SESSION_SECRET` signs every session out.
