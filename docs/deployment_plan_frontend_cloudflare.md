# Frontend Deployment Plan — Cloudflare Pages

## Build and Environment
- Build command: `npm run build`
- Output directory: `dist`
- Environment variables:
  - `VITE_API_URL` for API base (e.g., https://api.srirentabike.com/api)
- Branch rules:
  - `main`: Production
  - `develop`: Staging
  - Preview for feature branches

## Cache and Performance
- Cache-Control:
  - Static assets: `public, max-age=31536000, immutable`
  - HTML: `no-cache`
- Compression:
  - Cloudflare auto Brotli/Gzip; no extra plugins required
- Asset hashing:
  - Vite emits hashed filenames for cache-busting

## Security Headers
- Configure via Cloudflare Pages `_headers` or Cloudflare dashboard:
  - `Content-Security-Policy`: default-src 'self'; img-src 'self' data: https:; connect-src 'self' https:;
  - `Strict-Transport-Security`: max-age=31536000; includeSubDomains; preload
  - `X-Content-Type-Options`: nosniff
  - `Referrer-Policy`: no-referrer
  - `Permissions-Policy`: camera=(), microphone=(), geolocation=()

## CI/CD Pipeline
- GitHub integration:
  - Build on push with status checks required
- Testing gates:
  - Typecheck: `npm run check`
  - Lint: `npm run lint`
  - Optional: E2E previews using Playwright on deploy previews
- Approvals:
  - Require PR approvals before merging to `main`
- Rollback:
  - Revert to previous successful deployment via Cloudflare Pages UI

