# Architecture Documentation

## Overview
SriRent Bike is built on a modern full-stack architecture using Next.js 14, leveraging Server Components for performance and Client Components for interactivity. The application is designed with a clear separation between the public-facing Guest interface and the secure Admin management portal.

## Data Model (Prisma)

The database schema (`prisma/schema.prisma`) defines the core entities:

### 1. Customer
Represents the guest renting a bike.
- **Key Fields**: `firstName`, `lastName`, `nationality`, `passport/doc number`, `contact info`.
- **Relation**: One-to-Many with `Agreement`.

### 2. Bike
Represents the fleet of vehicles.
- **Key Fields**: `make`, `model`, `plateNo` (Unique), `engineNo`, `chassisNo`, `color`.
- **Relation**: One-to-Many with `Agreement`.

### 3. Agreement
The core transactional record linking a Customer and a Bike.
- **Status**: `PENDING` (Created via Check-in) → `ACTIVE` (Approved by Admin) → `COMPLETED`.
- **Financials**: `ratePerDay`, `totalDays`, `totalAmount`, `deposit`.
- **Vehicle State**: `fuelLevel`.
- **Relation**: Belongs to one `Customer` and optionally one `Bike`.

### 4. User (Auth)
Admin and staff accounts.
- **Key Fields**: `email`, `password` (Argon2 hashed), `role` (`ADMIN` or `STAFF`).

---

## Authentication & Authorization

### Authentication Flow
1.  **Provider**: Credentials Provider (Email/Password).
2.  **Verification**: Passwords are hashed and verified using `argon2`.
3.  **Session**: JSON Web Tokens (JWT) are used for stateless session management.
4.  **Middleware**: `middleware.ts` protects `/admin` routes by verifying the JWT token.

### Authorization
- **Public**: `/check-in`, `/login`, `/api/check-in`.
- **Protected**: `/admin/*`, `/api/agreements/*`.
- **Role-Based**: The system supports `ADMIN` and `STAFF` roles (schema-ready), allowing for future feature gating (e.g., only Admins can delete agreements).

---

## Workflow

### 1. Guest Check-In Flow
1.  Guest scans QR code → lands on `/check-in`.
2.  Completes 3-step wizard (Personal Info, Contact, ID).
3.  **Submission**:
    -   Creates a `Customer` record.
    -   Creates a `PENDING` Agreement record linked to the customer.
    -   Returns the `agreementId`.
4.  Success message displayed.

### 2. Admin Review Flow
1.  Admin logs in → Dashboard lists `PENDING` agreements.
2.  Admin selects an agreement → Edit Page.
3.  **Processing**:
    -   Selects a `Bike` from the fleet.
    -   Verifies dates and sets `ratePerDay`.
    -   System auto-calculates totals.
    -   Updates status to `ACTIVE`.
4.  **Finalization**:
    -   Admin clicks "PDF" preview.
    -   Verifies details and downloads/prints the Rental Agreement.
    -   Both parties sign the physical/printed copy.

---

## Folder Structure

```
/app
  /api              # Next.js Route Handlers (Backend)
    /auth           # NextAuth endpoints
    /check-in       # Public POST endpoint for guest submission
    /agreements     # Protected CRUD endpoints for admin
  /admin            # Admin UI (Server Components + Client Islands)
  /check-in         # Guest UI
  layout.tsx        # Root layout (Fonts, global styles)
  page.tsx          # Landing page

/components
  /admin            # Admin-specific components (Tables)
  /auth             # Login forms
  /forms            # Business logic forms (RHF + Zod)
  /pdf              # React-PDF templates
  /ui               # Shared primitives (Buttons, Inputs, etc.)

/lib
  db.ts             # Global Prisma Client instance
  env.ts            # Environment variable validation schema
  utils.ts          # Helper functions (cn, dates)
```
