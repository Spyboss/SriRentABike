# Deployment Guide

This guide covers deploying the SriRent Bike application to production environments, specifically focusing on Vercel and Supabase.

## Prerequisites

1.  **Vercel Account**: For hosting the Next.js frontend and API.
2.  **Supabase Account**: For the PostgreSQL database.
3.  **Sentry Account**: For error monitoring (optional but recommended).

---

## 1. Database Setup (Supabase)

1.  Create a new project in Supabase.
2.  Go to **Project Settings > Database** and copy the **Connection String** (Transaction Pooler mode is recommended for serverless environments).
    -   Format: `postgres://[user]:[password]@[host]:6543/[db_name]?pgbouncer=true`
3.  Save this as your `DATABASE_URL`.

---

## 2. Environment Variables

Configure the following variables in your Vercel Project Settings:

| Variable | Description | Example |
| :--- | :--- | :--- |
| `DATABASE_URL` | Supabase connection string | `postgres://...` |
| `NEXTAUTH_URL` | Canonical URL of your deployment | `https://srirent.vercel.app` |
| `NEXTAUTH_SECRET` | 32+ char random string for encryption | `openssl rand -base64 32` |
| `INIT_ADMIN_EMAIL` | Email for the initial admin account | `owner@srirent.com` |
| `INIT_ADMIN_PASSWORD` | Password for the initial admin | `SecurePass123!` |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry Client DSN | `https://...@sentry.io/...` |
| `SENTRY_DSN` | Sentry Server DSN | `https://...@sentry.io/...` |

---

## 3. Build & Deploy (Vercel)

1.  Connect your GitHub repository to Vercel.
2.  Vercel will automatically detect the Next.js framework.
3.  **Build Command**: `next build` (Default)
4.  **Install Command**: `npm install` (Default)
5.  Click **Deploy**.

### Post-Deployment Database Migration

After the first deployment (or when schema changes occur), you need to run migrations against the production database. You can do this from your local machine (if you update your local `.env` to point to prod) or via a custom build command.

**Recommended: Run locally pointing to prod**
1.  Update local `.env` `DATABASE_URL` to the production URL.
2.  Run:
    ```bash
    npx prisma migrate deploy
    ```
    *Note: `migrate deploy` is safe for production; it applies pending migrations without resetting the DB.*

### Seeding the Admin User
To ensure the initial admin user exists in production:
1.  Run the seed script against production:
    ```bash
    npx prisma db seed
    ```
    This script reads `INIT_ADMIN_EMAIL` and `INIT_ADMIN_PASSWORD` and upserts the user.

---

## 4. Monitoring (Sentry)

The application is pre-configured with Sentry.
1.  Create a Sentry project.
2.  Get your DSN.
3.  Add `SENTRY_DSN` and `NEXT_PUBLIC_SENTRY_DSN` to Vercel environment variables.
4.  Redeploy.

Errors (both client-side and server-side) will now appear in your Sentry dashboard.

---

## Troubleshooting Common Issues

### "Tenant or user not found" (Prisma)
-   **Cause**: Incorrect `DATABASE_URL` or the database is paused.
-   **Fix**: Check Supabase dashboard to ensure the project is active. Verify the password in the connection string.

### 504 Gateway Timeout (Vercel)
-   **Cause**: Long-running API requests (e.g., generating a massive PDF or complex query).
-   **Fix**: The app is optimized, but ensure DB queries are efficient. Vercel serverless functions have a 10s default timeout (can be increased on Pro plans).

### Auth Errors
-   **Cause**: `NEXTAUTH_SECRET` missing or `NEXTAUTH_URL` mismatch.
-   **Fix**: Ensure `NEXTAUTH_URL` matches the deployed domain exactly (including `https://`).
