# Deployment Execution Plan

## Checklist — Pre-deployment
- Documentation updated and reviewed
- Env vars verified across dev/staging/prod
- Supabase migrations applied and validated
- Storage bucket `rental-agreements` present
- Frontend build passes `npm run check` and `npm run build`
- Backend builds and health check OK locally

## Deployment Sequence
- T-60m: Announce window; confirm team availability
- T-30m: Prepare backups; verify staging
- T-0m: Deploy backend on Railway; wait for health check pass
- T+10m: Deploy frontend on Cloudflare Pages; verify preview → production
- T+20m: Run smoke tests on production

## Post-deployment Validation
- Verify guest link flow, admin login, agreement update, PDF generation/download
- Check error rates and latency dashboards
- Confirm logs and storage uploads functioning

## Scheduling Considerations
- Low-traffic windows based on analytics
- Team availability with on-call coverage
- External dependency windows (Supabase maintenance)

## Stakeholder Communication
- Status updates:
  - Pre-deploy notice
  - Start, midpoint, completion updates
  - Incident reporting via Slack/Email
- User Notifications:
  - Maintenance banners for short downtime windows
  - Post-deploy success message if applicable

