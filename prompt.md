# Universal Backend Prompt — UI-ready → Postgres + Prisma (+ optional RAG)

> **Use this file on ANY project** where the frontend/UI is already built and you need a real backend.  
> **Stack default:** PostgreSQL + Prisma + Next.js (or similar) | **NOT Supabase** unless the user explicitly asks.  
> **Vector:** assume / enable **pgvector** when the UI has AI / search / chat / matching.  
> **AI default provider: GapGPT** (`https://api.gapgpt.app/v1`). **Secondary: OpenAI / ChatGPT.**  
> **Universal brand/SEO (every project):** favicon + logo design/replace · search-engine indexing gate (closed until GO-LIVE).  
> **Done = proven on the deployed URL** (HTTP/`curl`). Green build or “page is not 500” is **not** done.

---

## How to use this file

1. Open the target project in Cursor.
2. Make sure Phase 0 (infra) below is done or doable.
3. Copy the **English Master Prompt** into **Agent mode** (Ask mode cannot run `curl` or tick a phase).
4. Read the Persian sections to verify the plan before allowing the next phase.
5. After Agent produces the project-specific phase plan → approve **one phase at a time** and paste that phase’s execute prompt.
6. After implement + deploy: tell the Agent the **staging URL** and: *prove Phase N on this URL, then STOP.*

**Host / terminal (this user’s default — all projects):** commands run on the **Runflare Linux pod** (`root@…:/app#`). Agent MUST print **bash** `curl` one-liners (never `curl.exe`, never `\` continuations, never empty `$SITE`). JSON: `-d '{"k":"v"}'`.

**Language tip:** English prompts → better code quality. Persian → for you to understand and verify. UI text stays in the project’s language (often fa-IR).

---

## Global rules (NON-NEGOTIABLE)

1. **Do not redesign UI layout / design system.** Wire existing pages to API + DB.  
   **Exceptions (required on every project):** brand **favicon** and a simple **logo** asset (see Brand assets below) — replace defaults; do not reinvent the whole visual system.
2. **Audit the whole UI first** (routes, nav, roles, forms, modals, mock/localStorage) before writing schema.
3. Prefer **at most 5 backend phases**. Smaller apps may use 2–4 phases (justify why).
4. If UI clearly has smart features (chat, semantic search, matching, content AI, pricing AI) → add **optional Phase 6: RAG** with pgvector. If not, stop after Phase 5 (or earlier).
5. **UI input rule:** any user input → proper **modal or in-page form**. Never use `alert` / `prompt` / toast-as-input.
6. Identifiers in code/Prisma/API: **English**. User-visible copy: keep project language.
7. Secrets only in env / host panel — never commit real keys. Provide `.env.example` placeholders only.
8. One phase at a time: implement → migrate → seed (if needed) → **prove on deployed URL** → **STOP** until user confirms.
9. Prefer replacing mock/localStorage gradually; do not invent unrelated product features.
10. Auth mock OTP (if phone login): respect `DEV_OTP_*` even when `NODE_ENV=production` during build; document removal in GO-LIVE.
11. **Search engines (universal):** While the product is incomplete / pre–GO-LIVE, **block indexing** (`robots` / `noindex` / `BLOCK_SEARCH_ENGINES=true`). At GO-LIVE (Phase 5), document and switch to **allow indexing** when the user confirms the product is ready to sell/publish publicly.
12. **Favicon + logo (universal):** In Phase 5 (or earlier if the user asks), design and install project-brand favicon + a logo used in header/landing — based on existing product name/colors; ship files under `app/` / `public/` and wire metadata.
13. **No local `next dev` as the test environment** if the machine/VPS hangs or file-watchers thrash RAM. Test environment = **deployed staging** (same stack as prod, not public sales, indexing blocked).
14. **Definition of done is machine-provable** on `NEXT_PUBLIC_SITE_URL` / the staging host. The Agent must send HTTP (`curl` or equivalent), read the **raw** JSON/status, and only then tick. A green `tsc` / host build / HTML 200 is **not** proof the DB is wired.
15. **Three proofs every backend phase (adapt names):**
    1. Migration applied on the staging/project DB.
    2. Full flow: auth (if any) → **create** → **GET the same id** (body must match what was written — not leftover mock/`localStorage`).
    3. If the UI is multi-tenant: tenant B must **not** receive tenant A’s records (empty list / 404 — a 200 that leaks A is a failed phase).
16. **Uploads:** if the phase includes media, prove the file exists on disk / `UPLOAD_DIR` (or the host mount), not only a blob URL in memory.
17. **Mid-stakeholder demo:** after **Phase 2** (core domain) is proven on staging, pause for a short client look at **real** data on the locked UI. Do not wait until Phase 5.
18. **Ask vs Agent:** planning/review may use Ask mode. Execute + `curl` + ticks require **Agent mode**. The Agent may not tick because “it looks fine.”
19. **Host order:** on the new pod, `npx prisma migrate deploy` **then** `npx prisma db seed`. Seed-first → P2021 / missing tables.
20. **STOP output:** every phase ends with copy-paste **bash** commands for the **Runflare Linux pod** (`root@…:/app#`). Use `curl` (never `curl.exe`). One full command per line. No `\` line continuation. Literal `https://…` URL. JSON body: `-d '{"key":"value"}'` (single quotes around JSON). Empty `$SITE` is a failed proof. Same block lives in the project TODO and `backend-dev/TEST-MANUAL.md`.

---

## Brand assets & search engines (UNIVERSAL — every project)

These apply whether the product is Matnva, a shop, a clinic app, or anything else using this prompt.

### Favicon + logo

| Rule | Detail |
|------|--------|
| When | Default: **Phase 5 (GO-LIVE)**. Earlier only if user asks. |
| Favicon | Design a simple mark matching the product brand (letter/monogram OK). Replace `app/favicon.ico` and/or add `app/icon.png` (Next.js Metadata). |
| Logo | Design a compact logo (SVG or PNG) and place it where the UI already shows a brand mark (header, landing hero, auth card) — **swap asset only**, keep layout. |
| Do not | Full visual redesign, new color system, or random stock logos unrelated to the product name. |
| Checklist | Browser tab shows new favicon · header/landing uses new logo · no broken image paths. |

### Search-engine indexing gate

| Stage | Behavior |
|-------|----------|
| **During build / incomplete product** | Block crawlers: env `BLOCK_SEARCH_ENGINES=true` (or equivalent) · `robots: { index: false }` in root layout · optional `public/robots.txt` Disallow. |
| **GO-LIVE (user confirmed ready)** | Set `BLOCK_SEARCH_ENGINES=false` (or remove) · allow index/follow · update `robots.txt` Allow · document in `backend-dev/GO-LIVE.md`. |
| Agent duty | Audit whether blocking already exists; if missing, add it in an early phase or Phase 5 prep; **never leave a half-ready public site indexable by default**. |

### فارسی — برند و موتور جستجو (همه پروژه‌ها)

```
فاویکون + لوگو: در فاز ۵ (یا زودتر اگر بخواهی) بر اساس نام/رنگ محصول طراحی و جایگزین شود؛ لایه‌بندی UI عوض نشود.
موتور جستجو: تا محصول کامل/آماده فروش نشده → ایندکس بسته (BLOCK_SEARCH_ENGINES / noindex).
وقتی GO-LIVE تأیید شد → ایندکس باز و در GO-LIVE.md ثبت شود.
```

---

## Phase 0 — Infrastructure (HUMAN — before coding)

Do manually (adapt names to the host: Runflare, Docker, VPS, …):

1. PostgreSQL ready; create project database.
2. If AI/RAG likely: ensure **pgvector** available → `CREATE EXTENSION IF NOT EXISTS vector;`
3. `.env.local` with **remote** `DATABASE_URL` for local Cursor/migrate.
4. Production/host env with **internal** `DATABASE_URL` when app and DB share a private network.
5. Persistent disk / folder for uploads if UI has media.
6. Never commit secrets.
7. Set `BLOCK_SEARCH_ENGINES=true` on staging / incomplete production until GO-LIVE.
8. Staging URL in `NEXT_PUBLIC_SITE_URL` (or tell the Agent the URL in chat). Optional basic-auth / unlisted hostname so the public does not treat it as the shop.

### Standard env template

```
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DB_NAME
NEXT_PUBLIC_SITE_URL=https://staging.example.com
SESSION_SECRET=change-me-min-32-chars
DEV_OTP_PHONE=
DEV_OTP_CODE=
NODE_ENV=development
UPLOAD_DIR=public/uploads

# Search engines — true while incomplete; false at GO-LIVE
BLOCK_SEARCH_ENGINES=true

# AI — GapGPT default, OpenAI secondary
AI_PROVIDER=gapgpt
GAPGPT_API_KEY=
AI_BASE_URL=https://api.gapgpt.app/v1
OPENAI_API_KEY=
EMBEDDING_MODEL=text-embedding-3-small
CHAT_MODEL=gpt-4o-mini
AI_DAILY_TOKEN_LIMIT=500000
```

| `AI_PROVIDER` | Base URL | Key |
|---------------|----------|-----|
| `gapgpt` (default) | `https://api.gapgpt.app/v1` | `GAPGPT_API_KEY` |
| `openai` (secondary) | `https://api.openai.com/v1` | `OPENAI_API_KEY` |

---

## English Master Prompt (paste into Agent first)

```
You are building the BACKEND for an existing UI-complete project.

STACK (defaults):
- PostgreSQL + Prisma
- NOT Supabase unless I explicitly ask
- pgvector when AI/RAG is needed
- AI: OpenAI-compatible client; DEFAULT provider GapGPT (baseURL https://api.gapgpt.app/v1, GAPGPT_API_KEY); SECONDARY openai (OPENAI_API_KEY). Resolve via AI_PROVIDER (default gapgpt). Never put API keys in the browser.

HARD RULES:
1) Do NOT redesign UI layout/visual system — only wire to real API/DB.
   EXCEPTIONS (required every project): design+install brand favicon and a simple logo (Phase 5 by default); do not rebuild the design system.
2) UI inputs only via proper modals/forms — no alert/prompt/toast-as-input.
3) Plan in AT MOST 5 backend phases (ok to use fewer if small). If UI has chat/semantic search/matching/content-AI/pricing-AI, add OPTIONAL Phase 6 RAG.
4) One phase at a time after I approve the plan. STOP after each phase until I confirm AND deployed HTTP proofs are green.
5) English code identifiers; keep existing UI language for copy.
6) Secrets in env only; create .env.example without real values.
7) If phone OTP auth exists or fits the UI login: support DEV_OTP_PHONE + DEV_OTP_CODE mock even when NODE_ENV=production during build phase; document GO-LIVE removal.
8) SEARCH ENGINES (universal): keep indexing BLOCKED while incomplete (BLOCK_SEARCH_ENGINES=true / noindex / robots). At GO-LIVE, document flipping to allow indexing only after I confirm the product is ready.
9) FAVICON + LOGO (universal): Phase 5 must include designing and wiring project-brand favicon + logo into existing header/landing slots.
10) Do NOT start local next dev if the workspace/host hangs. The test environment is the deployed staging URL I give you (NEXT_PUBLIC_SITE_URL).
11) A phase is NOT done when tsc/build is green or the HTML page is not 500. It is done when YOU prove it on that URL with HTTP requests (curl or equivalent): persist create→GET same id, and tenant isolation if multi-tenant. If the UI still serves mock/localStorage, the phase is failed.
12) Do not tick TEST-MANUAL or the roadmap until those request transcripts are green. Paste status codes + relevant JSON fields (no secrets) into TEST-MANUAL.
13) After Phase 2 is proven on staging, STOP for a short stakeholder demo before Phase 3+.
14) Execute + verify in Agent mode. Ask mode cannot curl or tick.
15) After deploy, on the NEW pod: `npx prisma migrate deploy` THEN `npx prisma db seed`. Never seed first. P2021 “table does not exist” means migrate was skipped.
16) At STOP of every phase, print copy-paste **bash** commands for the Runflare Linux pod (`root@…:/app#`):
    - `curl` — NEVER `curl.exe` (that is Windows; the pod says `command not found`)
    - ONE command per line — NEVER `\` line continuation (paste on the pod concatenates/garbles)
    - Literal origin `https://…` — NEVER empty `$SITE`
    - JSON: `-d '{"phone":"0912…"}'` (single quotes wrapping JSON)
    Write the same block into the project TODO and TEST-MANUAL.

STEP A — FULL UI AUDIT (read-only first; no big coding yet):
- List all routes/pages (app router, pages router, or equivalent)
- Nav / role gates / permission matrix
- Forms, wizards, modals, upload flows
- Mock data modules and localStorage keys
- Entities implied by the UI (users, tenants/agencies/shops, catalog, orders, bookings, messages, settings, …)
- Multi-tenant signals (multiple offices/shops/orgs in admin UI)
- AI surfaces that will need RAG later
- Current favicon/logo assets and whether search indexing is blocked or open

STEP B — DELIVER A PROJECT-SPECIFIC BACKEND ROADMAP:
Output in this chat (and optionally offer to write prompts-<project>.md):
1) Domain inventory (models + which pages they power)
2) Env vars list for this project (include BLOCK_SEARCH_ENGINES)
3) Phase plan (≤5 + optional RAG) with:
   - Goal
   - Prisma models / migrations
   - API routes
   - Frontend pages to wire
   - Seed / fixtures
   - Deployed HTTP proof (curl steps: auth, create, GET same id, tenant-B isolation)
   - Manual / UI glance only AFTER curl is green
   - Explicit STOP condition
4) Map each phase to existing files (mock → API)
5) Explicit Phase 5 bullets: favicon + logo + indexing gate GO-LIVE

Suggested phase skeleton (ADAPT names to THIS project; drop unused phases):

Phase 1 — Auth + RBAC (+ tenancy if UI is multi-tenant)
Phase 2 — Core domain entities (main list/detail/create flows)
Phase 3 — Operational workflows (transactions, bookings, deals, tickets, etc.)
Phase 4 — Secondary modules (imports, marketplace, notifications, links, reports wiring)
Phase 5 — Platform/admin/settings/security + favicon/logo + search-index GO-LIVE + docs + reset script
Phase 6 (optional) — RAG/AI: chunk→embed→pgvector retrieve; GapGPT default; agency/tenant filter mandatory if multi-tenant

STEP C — WAIT:
Do NOT start Phase 1 implementation until I reply approving the plan (or requesting edits).
When I say to start a phase, implement ONLY that phase, then STOP until I deploy (or the URL is already live) and you prove it with curl. Do not start N+1.
```

### فارسی — پرامپت اصلی (توضیح)

```
Agent اول کل UI را بررسی کند (مسیرها، نقش‌ها، فرم‌ها، mock، چندمستأجری، صفحات AI، فاویکون/لوگو، وضعیت ایندکس).
بعد نقشه بک‌اند مخصوص همان پروژه را بدهد: حداکثر ۵ فاز (+ فاز ۶ RAG اگر UI هوشمند داشت).
استک: Postgres + Prisma؛ AI پیش‌فرض GapGPT، دوم OpenAI.
UI بازطراحی نشود — به‌جز فاویکون و لوگوی برند (الزامی در فاز ۵).
ایندکس موتور جستجو تا GO-LIVE بسته بماند؛ بعد از تأیید باز شود.
تا وقتی نقشه را تأیید نکردی کد فاز ۱ را شروع نکند.
هر فاز: پیاده → دیپلوی → روی پاد migrate deploy سپس seed → ایجنت کرل bash یک‌خطی (`curl` نه curl.exe، بدون \، آدرس کامل) چاپ کند → روی همان پاد Runflare پیست شود → توقف.
اگر seed گفت جدول نیست (P2021) یعنی migrate نرفته.
اگر seed گفت جدول نیست (P2021) یعنی migrate نرفته.
بیلد سبز یا «صفحه ۵۰۰ نداد» تیک نیست. اگر هنوز mock است فاز شکست خورده.
```

---

## After audit — what “good plan” looks like

Agent’s roadmap should include:

| Section | Content |
|---------|---------|
| Inventory | Entities ↔ pages ↔ mock files |
| Tenancy | Single-tenant vs multi-tenant (from UI evidence) |
| Auth shape | Phone OTP / password / both — match existing login UI |
| Uploads | Disk path + which entities need media |
| Brand | Favicon + logo plan (Phase 5) |
| Indexing | Current block state + GO-LIVE flip steps |
| Phase table | 1…≤5 (+6?) with dependencies |
| Risks | Missing pgvector, no SSH, host limits, local `next dev` hangs, mock mistaken for DB |
| Deploy proof | curl on staging URL: persist + tenant isolation |
| Out of scope | Real SMS/pay/native unless UI+user require |

### فارسی — خروجی خوب نقشه

```
موجودیت‌ها و صفحات، نوع تننسی، شکل لاگین، آپلود، فاویکون/لوگو، گیت ایندکس، جدول فازها، اثبات curl روی دامنه، ریسک‌ها، خارج از اسکوپ.
اگر چیزی در UI نیست، به زور به بک‌اند اضافه نکند.
```

---

## Phase execute template (reuse each time)

When you approve a phase, paste:

```
EXECUTE PHASE N ONLY for this project — follow the approved roadmap.

Rules:
- Only Phase N scope from the plan
- Prisma migrate + seed if planned. On the host, order is mandatory: `npx prisma migrate deploy` then `npx prisma db seed`. Seed-first is a failed phase (P2021).
- Wire listed pages; do not redesign UI (favicon/logo only if Phase 5 or explicitly in this phase)
- Proper modals/forms for any new input
- Agency/tenant isolation if multi-tenant
- Keep BLOCK_SEARCH_ENGINES / noindex until GO-LIVE approval (Phase 5)
- Do not start local next dev. After deploy (or if SITE_URL is already live), YOU run curl against that URL:
  auth → create → GET same id (must be DB, not mock) → tenant B must not see tenant A.
- At STOP, print bash one-liners for the Runflare pod: `curl` not `curl.exe`; no `\`; literal URL; `-d '{"…"}'`. Also write them at the end of that phase in the project TODO.
- Tick TEST-MANUAL only if those responses prove it. Paste status + key fields (no secrets).
- STOP. Do not start N+1. After Phase 2 proof, wait for a short stakeholder demo.

If anything in the UI conflicts with the plan, ask me before inventing behavior.
```

### فارسی — اجرای فاز

```
فقط همان فاز را پیاده کن. next dev لوکال راه نینداز.
روی پاد جدید اول migrate deploy بعد seed (برعکس = جدول نیست / P2021).
وصل UI؛ بعد از دیپلوی روی پاد Runflare (bash): curl نه curl.exe؛ هر دستور یک خط بدون \ ؛ آدرس کامل دامنه؛ JSON داخل تک‌کوتیشن.
(ساخت → خواندن همان id → مرز مستأجر). در توقف همان کرل نهایی را چاپ کن.
تا سبز نشده تیک نزن. متوقف شو.
تا GO-LIVE ایندکس را باز نکن مگر فاز ۵ و تأیید من.
```

---

## Deployed HTTP proof (UNIVERSAL — every project)

The Agent is the tester. The human pastes commands into the **Runflare Linux pod** (`root@<deploy-pod>:/app#`). Do not write Windows / PowerShell commands.

**Terminal format (mandatory for every project using this prompt):**

| Do | Do not |
|----|--------|
| `curl` | `curl.exe` (`command not found` on the pod) |
| One full command per line | `\` at end of line (paste breaks / concatenates) |
| Literal `https://domain.tld/...` | Empty `$SITE` |
| `-d '{"key":"value"}'` | PowerShell `\"` escaping |
| `npx prisma migrate deploy` then `db seed` on the **new** pod | Seed first |

Cookie jar for session. **Never print secrets, session tokens, or passwords in git.**

**On the new pod, before any curl of a schema-changing phase:**

```
npx prisma migrate status
npx prisma migrate deploy
npx prisma db seed
```

If seed says `P2021` / table does not exist: migrate was not applied. Do not retry seed until `migrate deploy` is green.

At STOP the Agent must paste the same host block + the phase’s final **one-line** curls (also stored in the project TODO / `backend-dev/TEST-MANUAL.md`).

Minimum pattern (adapt paths; replace with the real URL):

```
curl -sS "https://example.com/api/health/db"
curl -sS -c jar.txt -X POST "https://example.com/api/auth/otp/send" -H "Content-Type: application/json" -d '{"phone":"0912…"}'
curl -sS -b jar.txt -c jar.txt -X POST "https://example.com/api/auth/otp/verify" -H "Content-Type: application/json" -d '{"phone":"0912…","code":"00000"}'
curl -sS -b jar.txt "https://example.com/api/auth/me"
curl -sS -b jar.txt -X POST "https://example.com/api/<entity>" -H "Content-Type: application/json" -d '{"title":"test"}'
curl -sS -b jar.txt "https://example.com/api/<entity>/<id>"
curl -sS -c jar-b.txt -X POST "https://example.com/api/auth/otp/send" -H "Content-Type: application/json" -d '{"phone":"tenant-B"}'
curl -sS -b jar-b.txt "https://example.com/api/<entity>"
```

Fail the phase if: mock/localStorage still powers the list; GET after POST misses the new id; tenant B sees A; upload has no file on disk; Agent only “looked at the page.”

---

## Default 5-phase skeleton (adapt freely)

### Phase 1 — Auth & access
- User, session/cookie, roles matching UI gates
- Tenancy tables if UI shows multiple orgs/offices/shops
- Login page wired; protect private routes
- Seed a known test account (project-specific phone/password)
- DEV_OTP if phone auth
- Ensure indexing stays **blocked** if not already (env + layout robots)

### Phase 2 — Core domain
- Main entities powering the primary nav (catalog, properties, patients, products, …)
- CRUD APIs + list/detail/create pages
- Media upload if core entities need images/docs
- Seed from existing mock data files
- **Prove on staging URL**, then **short stakeholder demo** (real rows on the locked UI) before Phase 3

### Phase 3 — Operations
- Workflows that create money/time/state changes (orders, bookings, deals, visits, tickets)
- Prefill flows that UI already has (query params, “convert to X”)
- Notifications if the UI has a center
- IDOR / cross-tenant checks

### Phase 4 — Collaboration & secondary
- Imports (Excel), shared marketplace, public links, reports feeding from DB
- Keep third-party SMS/pay mocked unless explicitly required

### Phase 5 — Platform & go-live prep (**includes brand + SEO gate**)
- Super-admin / settings / subscriptions if present in UI
- Security sessions page if present
- `reset-all` for staging
- **Favicon:** design + replace (`app/favicon.ico` / `app/icon.png` + metadata)
- **Logo:** design + place in existing header/landing brand slots
- **Search engines:** document flip `BLOCK_SEARCH_ENGINES=true → false` only after user confirms public launch; update `robots.txt` / layout metadata
- `backend-dev/GO-LIVE.md` (remove DEV_OTP, rotate secrets, indexing checklist)
- AI provider config UI may store GapGPT vs OpenAI preference; keys remain in env

### Phase 6 — Optional RAG
Only if audit found AI surfaces:
- `vector` extension; chunks with embedding dims matching `EMBEDDING_MODEL`
- Ingest from core entities; mandatory tenant filter if multi-tenant
- Wire search/chat/matching/content/pricing pages to retrieve + LLM via GapGPT default
- Friendly UI error if active provider key missing

---

## AI client resolution (for Phase 5–6 implementers)

1. `AI_PROVIDER` defaults to `gapgpt` when unset.
2. `gapgpt` → `GAPGPT_API_KEY` + `AI_BASE_URL` default `https://api.gapgpt.app/v1`.
3. `openai` → `OPENAI_API_KEY` + `https://api.openai.com/v1`.
4. Single server-side helper; never expose full keys in API JSON.
5. `vector(N)` dimension must match embedding model.

---

## Completion gates (any project)

A phase is done only when **all** of these are true. Code + green build alone is **not** enough.

- [ ] Migration applied on the staging/project DB
- [ ] Seed (if any) works
- [ ] Agent `curl` (or equivalent) on the **deployed URL**: create → GET same id (DB, not mock)
- [ ] If multi-tenant: tenant B request does **not** return tenant A rows
- [ ] If the phase has uploads: file present on disk / `UPLOAD_DIR`
- [ ] Transcript (status + key fields, no secrets) written in `backend-dev/TEST-MANUAL.md`
- [ ] No alert/prompt used as input
- [ ] *(After Phase 2)* Short stakeholder demo on staging scheduled/done
- [ ] User approved → next phase allowed
- [ ] *(Phase 5)* New favicon visible in the browser tab
- [ ] *(Phase 5)* Logo visible in header/landing brand slot
- [ ] *(Phase 5)* GO-LIVE.md lists how to open/close search indexing

---

## Optional: write a project-specific companion file

After audit, Agent may create `prompts-<projectSlug>.md` with the filled phase English prompts (like a Pasteur/amlakkiaei roadmap).  
Keep **this** `prompt.md` generic; put project details in the companion file.  
Project companions **must inherit** favicon/logo + indexing-gate + **deployed HTTP proof** rules from this file.

---

## Out of scope by default

- Full visual redesign / new marketing landing structure (favicon + logo swap is **in** scope)
- Real SMS / WhatsApp / payment gateway (mock unless requested)
- Native mobile apps
- Switching away from Postgres/Prisma without user request
- Opening public search indexing before user GO-LIVE confirmation

---

## Quick start checklist (you)

1. [ ] DB + (optional) pgvector ready  
2. [ ] `.env.local` filled (no quotes around values if your host hates quotes)  
3. [ ] `BLOCK_SEARCH_ENGINES=true` until GO-LIVE  
4. [ ] Paste **English Master Prompt** in Agent  
5. [ ] Review audit + phase plan  
6. [ ] `EXECUTE PHASE 1 ONLY` → deploy → Agent proves with `curl` on the staging URL → STOP  
7. [ ] Repeat through Phase ≤5 (+6 if needed). After Phase 2 proof: short client demo before 3+  
8. [ ] GO-LIVE: remove `DEV_OTP_*`, confirm GapGPT/OpenAI keys, **new favicon/logo live**, flip indexing only when ready to sell/publish  
