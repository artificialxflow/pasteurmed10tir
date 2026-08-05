# Pasteur Plus (pasteurmed10tir)

Next.js frontend + PostgreSQL/Prisma backend for Clinique Pasteur / پاستور پلاس.

> **Not Supabase.** Real auth and data go through Prisma against Runflare Postgres.

## Getting Started (local)

```powershell
npm install
# Copy env from prompts.md / .env.example patterns into .env.local
# Use REMOTE DATABASE_URL for Windows/Cursor
npx prisma migrate deploy
npm run db:seed
npm run db:seed:phase2
npm run db:seed:phase3
npm run db:seed:phase4
npm run db:seed:phase5
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Dev patient OTP (when `DEV_OTP_*` set): phone `09126723365`, code `00000`.  
Admin passwords: copy `ADMIN-CREDENTIALS.example.json` → `ADMIN-CREDENTIALS.local.json`, set strong values, then `npm run db:seed`. Never put passwords on `/admin/login` UI.

## Useful scripts

| Script | Purpose |
|--------|---------|
| `npm run db:migrate` | `prisma migrate dev` (local) |
| `npm run db:deploy` | `prisma migrate deploy` (CI / Runflare) |
| `npm run db:seed` | Auth seed (admins + dev patient) |
| `npm run db:seed:phase2` … `phase5` | Content / ops / commerce / club seeds |
| `npm run db:reset-all` | Wrapper for reset script (still needs `--confirm`) |
| `npx tsx scripts/reset-all.ts --confirm` | Wipe app data; **keep AdminRole/AdminUser** |

## Runflare deploy

1. Set env panel from `.env.production` pattern (see `prompts.md`):
   - **Internal** `DATABASE_URL` on Runflare private network
   - `NEXT_PUBLIC_SITE_URL=https://pasteur.plus`
   - `SESSION_SECRET` (strong in production)
   - Build-phase only: `DEV_OTP_PHONE` / `DEV_OTP_CODE` — remove before public go-live (`backend-dev/GO-LIVE.md`)
2. Mount persistent disk at `/app/public/uploads` for images (optional `UPLOAD_DIR`)
3. Deploy / redeploy the Next.js app
4. In Runflare terminal after deploy:

```bash
npx prisma migrate deploy
npm run db:seed          # if fresh DB
npm run db:seed:phase2
npm run db:seed:phase3
npm run db:seed:phase4
npm run db:seed:phase5
```

If migrate history drifts vs live schema, see notes in `backend-dev/TODO-v4.md` / `TODO-v5.md` (`db push` + `migrate resolve --applied`).

## Manual tests

See `backend-dev/TEST-MANUAL.md` (phases 1–5).

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- Project roadmap prompts: `prompts.md`
