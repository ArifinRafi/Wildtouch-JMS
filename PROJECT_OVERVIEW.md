# Wildtouch JMS — Project Overview

**Wildtouch JMS** (Jewellery Management System) is an internal business‑management web app for **Wildtouch / Sterling‑K Ltd**, a UK craft‑jewellery & souvenir business (currency **£ GBP**). It manages clients, inventory (components), products, planograms, orders, invoices, a vendor‑order tracker (River), a design pipeline (Design Tracker), tasks, agents, and more — with a role‑based login.

- **Live site:** https://wildtouch-jms.vercel.app (auto‑deploys from `main` on push)
- **Repo:** https://github.com/ArifinRafi/Wildtouch-JMS

---

## 1. Tech stack

| Area | Choice |
|------|--------|
| Framework | **Next.js 16.2.2** (App Router, Webpack, React 19) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4, glassmorphism theme, light/dark |
| UI primitives | **Base UI** (`@base-ui-components/react`) — *not* Radix |
| Animation | Framer Motion 12 |
| Icons | lucide-react |
| Auth | **NextAuth v5 (beta)** — Credentials + JWT sessions |
| Database | **MongoDB** via **Mongoose 9** (local + MongoDB Atlas) |
| Passwords | bcryptjs |
| Images | **Cloudinary** (unsigned upload) |
| Email | **Resend** (password‑reset tokens) |
| Hosting | **Vercel** |

> ⚠️ **This is NOT the Next.js you may know.** Next 16 has breaking changes — see `AGENTS.md`. Read `node_modules/next/dist/docs/` before writing Next‑specific code.

### Next 16 conventions used here
- **Middleware is renamed to `proxy.ts`** — exports a `proxy` function + `config.matcher`.
- Route handlers use `RouteContext<"/api/.../[id]">` with **awaited** `params` (`const { id } = await ctx.params`). For brand‑new routes whose generated types aren't built yet, the params can be typed inline (`ctx: { params: Promise<{ id: string }> }`).
- Route files must **not** export non‑handler functions — shared helpers live in `lib/` or `models/`.
- Mongoose **schema changes require a dev‑server restart** (models are cached in the process). Brand‑new models register on first import. Production picks up changes automatically on each build/deploy.
- `NEXT_PUBLIC_*` values are inlined at build time and can go stale in cached bundles — runtime config (e.g. Cloudinary) is read from a `force-dynamic` route (`/api/upload-config`) instead.

---

## 2. Authentication & roles

Role‑based login (NextAuth v5, JWT sessions). Config is split:
- `src/auth.config.ts` — edge‑safe config shared with `proxy.ts` (no DB).
- `src/auth.ts` — full config with the Credentials provider (bcrypt).
- `src/proxy.ts` — protects **all** pages + APIs except `/login` and `/api/auth`. Unauthenticated → APIs get **401 JSON**, pages redirect to `/login`.
- `src/lib/authz.ts` — `requireAdmin()`, `sessionUser()`, `isResponse()` guards.

### Roles
| | **Admin** | **Manager** |
|---|---|---|
| Login (username/email + password) | ✅ | ✅ |
| Create / delete admins & managers | ✅ | ❌ |
| Change password (via emailed 6‑digit token to master email) | ✅ | ❌ |
| Add / edit records (orders, planograms, products, tasks…) | ✅ | ✅ |
| **Delete** core data (clients, orders, invoices, components…) | ✅ | ❌ |
| Add/delete Whiteboard & Task Manager tasks | ✅ | ✅ (exception) |

- User management + password change live in **Settings**.
- Password reset sends a **6‑digit token** (hashed, 15‑min expiry) to `MASTER_ADMIN_EMAIL` via Resend.
- Login: username **`admin`** (or the master email) + the admin password.

---

## 3. Data models (`src/lib/models/`)

| Model | Purpose | Key fields |
|-------|---------|-----------|
| **User** | Login accounts | username, email, passwordHash, role (`admin`/`manager`), resetToken* |
| **Client** | Customers (`strict:false`, id = `CLT-001`) | name, addresses, contacts, **vatRate**, pricing, brandCardImage, barcodeImage |
| **Component** | Main inventory (stockable parts) | description, code, qtyAvailable, components[] |
| **Product** | Catalogue items built from components | name, code, image, components[] (BOM w/ qtyPerUnit) |
| **Planogram** | Stand layouts; per‑cell products | sides[] → rows[] → cells[] `{product,image,qty}` |
| **Order** | Customer orders (id `ORD-0001`) | orderNumber, status, planogram, client snapshot, lineItems, subtotal/shipping/vatRate/vat/total |
| **Invoice** | Generated from an order (id `INV-0001`) | invoiceNumber, client, lineItems, subtotal/shipping/**vatRate/vat**/total |
| **RiverOrder** | Orders to vendor "River" | orderNumber, product(component), qty, quantityReceived, priority, **shipmentMethod**, valueGbp/Rmb, **notesLog[]** `{date,note}`, linked inventory component |
| **Design** | Design Tracker rows | name, image, **clientName**, categoryType, notes, brochure/code‑sheet columns, completed, riverAcknowledged |
| **DesignCategory** | Managed category dropdown (seeded defaults) | name |
| **Task** | Task Manager | date, employeeName, taskName, status, priority |
| **Agent** | Sales agents (id `AGT-001`) | name, contact, referredPoints |
| **WhiteboardOrder** | Digital Whiteboard (id `WB-0001`) | order/task tracking |

String `_id` codes (`CLT-`, `AGT-`, `WB-`) preserve human‑readable ids.

---

## 4. Features (sidebar sections)

### Overview
- **Dashboard** — DB‑driven summary (`/api/dashboard/summary`): active orders, clients, products, revenue, stock alerts, pipeline.

### Core Data
- **Clients** — list + full add/edit profile (contacts, addresses, invoicing incl. **VAT rate**, pricing, product intelligence, **Brand Card & Barcode** images via Cloudinary). Click images to view **full‑screen** (lightbox).
- **Inventory** — the **components** master list. Add/edit/delete components (name + optional code + qty). *(Inventory = stockable components, not finished products.)*
- **Products** — catalogue built from inventory components (name, code, Cloudinary image, BOM with per‑unit quantities). Add/remove components reliably.
- **Planogram** — built‑in stand layouts (4‑sided floor stand, neck/brac/key/bag stand, large keyrings, magnets) **plus a builder** (`/planogram/new`): each grid **cell is its own product** (pick a product → photo auto‑shows → set qty). View page + print, per‑side columns.

### Operations
- **Digital Whiteboard** — order/task board (DB‑backed; managers can add/delete).
- **Task Manager** — pick a **date (calendar)**, then add tasks: **employee** (searchable autocomplete from the employee log or free‑typed), task name, **status** (pending/complete), **priority** (low/medium/high). Toggle status, edit priority inline, delete.
- **Orders** — multi‑page creation wizard: pick planogram → check inventory (BOM vs stock) → pick client → review → **confirm**. Confirming creates the Order + an Invoice. Open any saved order → view + **Download PDF** + **Packing List** (Wildtouch/Sterling‑K A4 packing slip with Proof‑of‑Delivery box, opens as a viewable page then Download PDF). A **planogram summary panel** (name, order #, products & quantities) shows beside the order/invoice on screen (not in the PDF).
- **Design Tracker** — pipeline of new component designs. **Spreadsheet‑style inline editing** (Edit → cells editable → Save locks). Columns: **Design** (image upload + name), **Client** (searchable client list or free text), **Category** (managed dropdown — type to add new, ✕ to delete options), Notes, Code Sheet / New Brochure / Themed Brochure, Completed. **Live** vs **Completed** tabs. Completing a design makes it orderable in River.
- **River** — orders to the vendor **River** who makes new components. **Spreadsheet‑style inline editing**, 15+ compact columns (no horizontal scroll at desktop width). Component field is a combobox over completed Design‑Tracker designs (or custom name). **Priority** dropdown (Normal/Medium/High), **Shipment** method, dated **Notes log**, **£/¥ value**. **Complete** or **Partial completion** adds the received quantity into the **main inventory** as a new component (creates once, tops up thereafter). A **New Design** notification badge counts completed designs waiting to be ordered.
- **Production → Home Workers / Overseas** — production staff/logs *(partly mock)*.
- **Agents** — sales agents CRUD (DB‑backed).
- **Branding Cards** — gallery of every client's uploaded brand card (searchable; links to the client).

### Finance
- **Invoicing** — invoice list + invoice detail. The invoice matches the physical **Wildtouch / Sterling‑K** template (Invoice #, Bill/Ship to, Item/Qty/Price/Total, Subtotal/Shipping/**VAT %**/Total, payment instructions, company info). The **same HTML** renders on screen (via iframe) and as the **A4 PDF**, so they're identical. **VAT is set per client** and applied automatically.

### Admin
- **Settings** — Your Account, Change Password (admin, via emailed token), and User management (create admins/managers, delete guarded).

---

## 5. API routes (`src/app/api/`)

CRUD REST routes back each module (list/create on the collection route, `[id]` for edit/delete). Highlights:

- `auth/[...nextauth]`, `users`, `users/[id]`, `users/me`, `users/password/{request,confirm}`
- `clients(+/[id],/seed)`, `inventory(+/[id],/seed)`, `products(+/[id],/seed)`
- `planograms(+/[id])`, `orders(+/[id])`, `orders/confirm`, `invoices(+/[id])`
- `river(+/[id])`, `river/[id]/receive` — partial/full completion tops up inventory
- `designs(+/[id])`, `design-categories(+/[id])`, `tasks(+/[id])`
- `agents(+/[id],/seed)`, `whiteboard(+/[id],/seed)`
- `dashboard/summary`, `upload-config` (runtime Cloudinary config)

Deletes on core data are **admin‑only** (`requireAdmin`) except Whiteboard & Task tasks.

---

## 6. Environment variables

`.env.local` (git‑ignored) — also set the same on **Vercel** (Production):

```
MONGODB_URI=mongodb://localhost:27017/wildtouch   # Atlas srv URI in prod
AUTH_SECRET=<random secret>
NEXTAUTH_URL=http://localhost:3000                # https://wildtouch-jms.vercel.app in prod
MASTER_ADMIN_EMAIL=jmsuk2026@gmail.com            # receives password-reset tokens
RESEND_API_KEY=<resend key>
EMAIL_FROM=                                        # blank → onboarding@resend.dev
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=db6kpcvxb
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=jms_product_image
```

- Cloudinary: unsigned preset `jms_product_image` (all product/planogram/brand‑card/barcode/design images).
- Atlas Network Access must allow `0.0.0.0/0`; a `@` in the DB password must be URL‑encoded as `%40`.
- A local MongoDB can be started with `docker-compose.yml` (mongo:7 on 27017).

---

## 7. Local development

```bash
cd wildtouch-jms
npm install
npm run dev          # or ./start-dev.sh  (Next dev on :3000 by default)
```

- `.claude/launch.json` configures the dev server for tooling (currently port 3001 to avoid a clash).
- Typecheck: `npx tsc --noEmit`. Lint: `npx next lint`.
- **Deploy:** push to `main` → Vercel auto‑builds. (Schema/model changes are picked up on rebuild; no manual step.)

---

## 8. Change history (most recent first)

| Commit | What |
|--------|------|
| `6bd4f96` | Design Tracker: managed category list — add custom categories + delete options |
| `e6dabca` | River: priority dropdown (Normal/Medium/High) + Shipment method column |
| `3962a27` | Design Tracker: min table height so short lists show the client dropdown |
| `377f721` | **Per‑client VAT rate** for invoices; Client column on each design |
| `1539e83` | Design Tracker: category is type‑dropdown only |
| `def1296` | **River**, **Design Tracker**, **Task Manager**, planogram summary panel |
| `50d39fa` | Packing List opens as a page, then Download PDF |
| `53613eb` | Wildtouch/Sterling‑K **invoice layout** + VAT |
| `276389a`,`05c3e32` | Packing slip (A4, centered) |
| `5f15716` | Full‑screen image lightbox (brand card / barcode) |
| `2293c9f` | Branding Cards gallery |
| `98647ec`,`0fc0938` | Brand Card & Barcode → Cloudinary (add + edit) |
| `b2f4364` | Open a saved order + print to PDF |
| `238b32f` | Planogram builder: per‑cell products |
| `66e6b13` | Inventory: dropped Category from components |
| `a57e228` | **Role‑based login** (Admin / Manager) |
| `5d722a2` | Orders, Planogram Builder, DB‑driven Clients/Products/Dashboard |
| `b19a83b` | MongoDB‑backed inventory module |
| earlier | Planogram designs (keyrings, magnets, 4‑sided stands), initial dashboard |

---

## 9. Conventions & gotchas

- **Inventory = components** (stockable parts), **Products** = finished items built from components. River completion feeds finished/new components into inventory.
- Item **prices are £0** by default on invoices until a pricing system is added; **VAT rate is captured per client** and applied to whatever prices exist.
- The **employee log** for Task Manager comes from the Shift Manager list (`src/lib/data/employees.ts`) plus any names already used in tasks.
- Secrets never go in committed code — only in git‑ignored `.env.local` / Vercel env.
- Commit/push only when asked; commit messages end with a `Co-Authored-By:` trailer.

---

*Generated as a snapshot of the project. Update as features evolve.*
