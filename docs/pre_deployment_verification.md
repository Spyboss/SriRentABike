# Pre-deployment Verification

## Test Cases — Core Journeys
- Guest fills form, signs, submits → Agreement created with `pending` status
- Admin logs in, views list, searches, filters, opens agreement detail
- Admin assigns bike, sets dates and rates, updates status
- Admin generates and downloads PDF, agreement marked `completed`

## Edge Cases
- Invalid guest token → 404/410 responses
- Expired guest token → status updated to `expired`
- Bike assignment when not available → 400 error
- PDF generation without signature or bike → 400 error
- Soft-deleted agreement access → 404 responses

## Failure Modes and Recovery
- Supabase storage upload failure → retry with backoff and error handling
- PDF upload failure → save locally and retry upload; keep audit log
- API rate limit exceeded → observe 429-like behavior via middleware message

## Security Validation
- Authentication:
  - `POST /api/auth/admin/login` returns JWT; protected routes require `Authorization: Bearer`
  - `GET /api/auth/me` returns current user when authorized
- Authorization:
  - Admin-only routes protected (`agreements`, `bikes`, `pdf`)
- Input Validation:
  - Agreement creation requires all mandatory tourist fields and signature
- Injection Prevention:
  - Use Joi validation and parameterized queries via Supabase client

## Rollback Procedures
- Recovery Steps:
  - Revert frontend to previous Cloudflare deployment
  - Roll back backend on Railway to last healthy deploy
  - Restore Supabase backup snapshot if schema/data regressions
- Backup Points:
  - Pre-deployment backups validated via test restore on staging
- Contacts:
  - Engineering on-call, Ops lead, Supabase support

