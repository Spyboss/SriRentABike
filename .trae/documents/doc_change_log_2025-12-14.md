# Documentation Change Log — 2025-12-14

- Updated technical architecture routes to match implementation:
  - Added `/api/pdf/generate/:agreementId`, `/api/pdf/download/:agreementId`, `/api/pdf/url/:agreementId`
  - Added `/api/agreements/public/:reference`, bikes endpoints, and `/api/health`
- Corrected initialization tool to “Vite”
- Expanded Authentication API section with `GET /api/auth/me` and `POST /api/auth/setup-admin`
- Updated Agreements DDL to include `pdf_status`, `deleted_at`, `updated_at`
- Revised PRD core process from “Email/Phone Verification” to “Guest Token Validation”
- Added PDF prerequisites (signature captured, bike assigned)
- Aligned README API endpoints with backend routes
- Clarified environment variable usage (frontend uses `VITE_API_URL`, Supabase keys server-side)

