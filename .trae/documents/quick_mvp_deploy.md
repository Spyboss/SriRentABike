# Quick MVP Deployment — 15 Minutes

## Backend (Railway)
- Create a new service from the GitHub repo; set root directory to `api`.
- Build: auto (NIXPACKS). Start: `npm start`.
- Set environment variables:
  - `SUPABASE_URL` = your Supabase project URL
  - `SUPABASE_SERVICE_ROLE_KEY` = service role key
  - `JWT_SECRET` = a strong random string
  - `NODE_ENV` = `production`
  - `FRONTEND_URL` = your frontend domain (for CORS)
- Verify health:
  - Open `https://<railway-app>.up.railway.app/api/health` → should return `{"status":"OK"}`.

## Frontend (Cloudflare Pages or Vercel)
- Connect repo and select root (project root).
- Build command: `npm run build`
- Output directory: `dist`
- Set environment variable:
  - `VITE_API_URL` = `https://<railway-app>.up.railway.app/api`
- Deploy and test:
  - Open the frontend URL; login and admin dashboard should load data.

## One-time DB Setup
- Run migrations in Supabase SQL editor:
  - `api/supabase/migrations/20241201_initial_schema.sql`
  - `api/supabase/migrations/20241212_admin_controls.sql`
- Ensure storage bucket:
  - Locally: `cd api && npm run setup:supabase`
  - Or manually create public bucket `rental-agreements`.

## Smoke Tests
- Guest link validation: `GET /guest-links/validate/:token`
- Create agreement (guest) → appears on admin dashboard.
- Assign a bike and generate/download PDF.

## Notes
- Update `FRONTEND_URL` on Railway to your frontend domain to pass CORS.
- If CORS blocks requests, confirm `VITE_API_URL` and `FRONTEND_URL` are correctly set.
