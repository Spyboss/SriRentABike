# System Synchronization Report — 2025-12-14

## Dependency Mapping
- Frontend (`package.json`):
  - `react` 18.3.1, `react-router-dom` 7.10.1, `vite` 6.3.5, `tailwindcss` 3.4.17
  - `@supabase/supabase-js` 2.87.1
- Backend (`api/package.json`):
  - `express` 4.18.2, `helmet` 7.1.0, `puppeteer` 21.5.2, `joi` 17.11.0
  - `@supabase/supabase-js` 2.38.4
- Observations:
  - Supabase client version mismatch between frontend (2.87.1) and backend (2.38.4). Recommend aligning backend to 2.87.x after validation.

## Environment Variables
- Frontend:
  - `VITE_API_URL` used in `src/services/api.ts`
  - `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` present in root `.env` but unused by code; remove or document as not required
- Backend:
  - Required: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`, `PORT`, `NODE_ENV`
  - Optional/tuning: `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX_REQUESTS`, `MAX_FILE_SIZE`, `UPLOAD_DIR`
  - Backend rejects start if Supabase env vars missing (`api/src/config/database.ts`)

## Database Schemas and Migrations
- Initial schema: `api/supabase/migrations/20241201_initial_schema.sql`
- Admin controls: `api/supabase/migrations/20241212_admin_controls.sql`
- Agreements now include `pdf_status`, `deleted_at`, `updated_at` columns
- Storage bucket `rental-agreements` required; ensured via `npm run setup:supabase`

## Configuration Validation
- Backend script `npm run setup:check` validates:
  - Table accessibility for `users`, `tourists`, `bikes`, `agreements`, `guest_links`, `audit_events`
  - Storage bucket listing
- Recommended additions:
  - Add column presence checks for `agreements(pdf_status, deleted_at, updated_at)`
  - Health check endpoint `/api/health` returns JSON `{ status: 'OK' }`

