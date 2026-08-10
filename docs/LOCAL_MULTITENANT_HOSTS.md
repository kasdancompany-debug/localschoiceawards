# Local multi-tenant hostnames

Locals Choice Awards uses wildcard-style community hosts.

## Preferred local setup (no hosts file)

Modern browsers resolve `*.localhost` to your machine. With `npm run dev`:

- http://localhost:3000 — central site
- http://saultstemarie.localhost:3000 — Sault Ste. Marie
- http://sudbury.localhost:3000 — Greater Sudbury
- http://winnipeg.localhost:3000 — Winnipeg
- http://marquette.localhost:3000 — Marquette
- http://detroit.localhost:3000 — Detroit
- http://admin.localhost:3000 — admin rewrite
- http://business.localhost:3000 — business rewrite
- http://supplier.localhost:3000 — supplier rewrite

Set in `.env.local`:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_ROOT_DOMAIN=localhost:3000
```

## Alternate hosts-file setup

If `*.localhost` is unavailable in your environment, map explicit hosts:

### Windows (`C:\Windows\System32\drivers\etc\hosts`)

```text
127.0.0.1 localschoiceawards.local
127.0.0.1 www.localschoiceawards.local
127.0.0.1 saultstemarie.localschoiceawards.local
127.0.0.1 sudbury.localschoiceawards.local
127.0.0.1 winnipeg.localschoiceawards.local
127.0.0.1 marquette.localschoiceawards.local
127.0.0.1 detroit.localschoiceawards.local
127.0.0.1 admin.localschoiceawards.local
127.0.0.1 business.localschoiceawards.local
127.0.0.1 supplier.localschoiceawards.local
```

Then set:

```env
NEXT_PUBLIC_APP_URL=http://localschoiceawards.local:3000
NEXT_PUBLIC_ROOT_DOMAIN=localschoiceawards.local:3000
```

Open http://saultstemarie.localschoiceawards.local:3000 and confirm the community proof panel shows a different community ID than Detroit or Sudbury.

## Production DNS

Point:

- `localschoiceawards.com`
- `www.localschoiceawards.com`
- `*.localschoiceawards.com`

to the application. Reserved labels (`www`, `business`, `account`, `admin`, `supplier`, `api`, `app`, `support`, `partners`, `assets`, `static`, `mail`) are never treated as community tenants.
