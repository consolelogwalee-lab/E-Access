# E-Access — Real Estate Web App

Built from the "E-access web app" Figma design. Next.js 16 + TypeScript + Tailwind CSS 4, with a real SQLite backend (Node's built-in `node:sqlite` — no native modules to compile).

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
# or production:
npm run build && npm start
```

Requires Node.js 22.13+ (for the built-in SQLite driver).

The app runs on **SQLite by default** (auto-created and seeded at `data/eaccess.db` — delete it to reset) and on **Postgres/Supabase when `DATABASE_URL` is set** (see `.env.example`; schema and seed run automatically on first request). Deploy target: Vercel + Supabase.

**Demo account:** `wale@eaccess.demo` / `password123` — or sign up fresh; the email verification code and password-reset link are shown on screen (simulated email, easily swappable for Resend/SendGrid later in `src/app/api/auth/`).

## What's implemented (core pass)

- **Landing page** — hero + search, Why Us, How It Works (4-step carousel), Featured Properties (interactive dark showcase), footer, floating nav with menu
- **Explore** — public listing browser with purpose/location/price/type filters + pagination
- **Auth** — entry, email sign up, 6-digit verification, login, forgot/reset password, preference setup, "account ready"
- **Dashboard / Discover** — personalized grid, filter drawer, filter tags, sort, search
- **Property details** — gallery, verification badges, property info, documents, similar properties, agent card, inquiries
- **Book Inspection** — physical/remote, date+time, notes, success state; "My Inspections" list with cancel
- **Add Listing wizard (5 steps)** — type-specific forms (Land / Apartment / Duplex / Commercial), media upload, document upload, review, submission ID + tracking
- **Portfolio** — listing list with inquiry counts; per-listing: Overview stats, Status & Verification, Performance, Listing Info + edit, Media, Documents, Inspection Requests (confirm / reschedule / cancel), Inquiries
- **Saved listings** — heart anywhere, persisted per user

Messages, Documents Vault, notifications and calendar-linking are stubbed for the second pass.

## Notes

- Property photos are generated placeholder SVGs in `public/images/` (`property-1.svg` … `property-12.svg`). Export the real photos from Figma and drop them in with the same names.
- Design tokens (Manrope + Fraunces, royal blue `#0d06a7`, lime accent, neutral scale) live in `src/app/globals.css`.
