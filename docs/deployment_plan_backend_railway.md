# Backend Deployment Plan — Railway

## Service Configuration
- Build: `npm run build` (NIXPACKS)
- Start: `npm start`
- `NODE_ENV=production`
- Resources:
  - Define CPU/RAM limits per environment
  - Enable auto-scaling based on CPU and response latency

## Health and Zero-Downtime
- Health checks:
  - HTTP path: `/api/health` expecting 200 JSON `{ status: 'OK' }`
  - Failure threshold: 3 consecutive failures
  - Startup grace period: 30–60s
- Zero-downtime:
  - Rolling deploys with minimum one healthy instance
  - Readiness waits for health check to pass before traffic shift

## Database and Storage
- Supabase:
  - Apply migrations: `20241201_initial_schema.sql`, `20241212_admin_controls.sql`
  - Ensure bucket `rental-agreements` exists (`npm run setup:supabase`)
- Connection pooling:
  - Use Supabase-managed pooling; keep request rate within limits

## Backups and Recovery
- Supabase backups:
  - Schedule daily logical backups via Supabase (or pg_dump)
  - Retain 14–30 days
- Restoration:
  - Test restore to staging before production rollback

## Monitoring and Alerts
- Metrics:
  - Response time, error rate, throughput
  - Memory/CPU usage on Railway
- Error tracking:
  - Integrate Sentry or equivalent
- Alerts:
  - Error rate > 2% for 5m
  - p95 latency > 800ms for 10m
  - Health check failures > 3

