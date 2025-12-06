# SriRent Bike Rental System

**SriRent Bike** is a comprehensive, mobile-first web application designed to digitize the manual rental process for a motorbike rental business in Sri Lanka. It streamlines the workflow from guest check-in to legal agreement generation, replacing handwritten paperwork with a secure, digital, and production-grade solution.

## 🚀 Key Features

### 1. Guest Check-In (Mobile First)
- **Digital Wizard**: A smooth, 3-step wizard (Personal → Contact → Documents) optimized for mobile devices.
- **Validation**: Real-time validation using Zod and `libphonenumber-js` to ensure data integrity.
- **Date Picker**: User-friendly date range selection for rental duration.

### 2. Admin Dashboard
- **Overview**: A comprehensive table view of all rental agreements.
- **Filtering & Sorting**: Search by customer name, sort by date, and filter by status (PENDING/ACTIVE).
- **Status Indicators**: Visual chips to quickly identify the state of each rental.

### 3. Agreement Management
- **Agreement Editor**: Assign bikes, set fuel levels, and calculate rental costs automatically.
- **Bike Management**: Searchable bike selector to quickly assign vehicles to customers.
- **Financials**: Automatic calculation of total rental days and amounts based on rates.

### 4. PDF Generation
- **Legal Documents**: Auto-generates professional Rental Agreements in PDF format.
- **Branding**: Includes SriRent branding, customer details, vehicle specs, and signature areas.
- **Robust Preview**: Built-in PDF viewer with error handling and download capabilities.

### 5. Security & Robustness
- **Authentication**: Secure admin access using NextAuth.js (Credentials provider with Argon2 hashing).
- **Authorization**: Role-based access control (Admin vs. Staff features).
- **Monitoring**: Integrated Sentry for real-time error tracking (Client, Server, and Edge).
- **Type Safety**: Full TypeScript implementation with strict environment variable validation.

---

## 🛠 Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [Shadcn/UI](https://ui.shadcn.com/) (Radix UI)
- **Database**: [PostgreSQL](https://www.postgresql.org/) (via [Supabase](https://supabase.com/))
- **ORM**: [Prisma](https://www.prisma.io/)
- **Authentication**: [NextAuth.js](https://next-auth.js.org/) v4
- **Forms**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **PDF**: [@react-pdf/renderer](https://react-pdf.org/)
- **Monitoring**: [Sentry](https://sentry.io/)

---

## ⚙️ Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database Connection (Supabase Transaction Pooler URL recommended)
DATABASE_URL="postgres://postgres.[ref]:[password]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000" # or your production URL
NEXTAUTH_SECRET="your-random-secret-key"

# Initial Admin Setup (Used for seeding)
INIT_ADMIN_EMAIL="admin@srirent.com"
INIT_ADMIN_PASSWORD="secure-password"

# Monitoring (Sentry)
NEXT_PUBLIC_SENTRY_DSN="https://..."
SENTRY_DSN="https://..."
```

---

## 🏃‍♂️ Getting Started

### 1. Clone & Install
```bash
git clone https://github.com/Spyboss/SriRentABike.git
cd SriRentABike
npm install
```

### 2. Database Setup
Ensure your `.env` file is configured with a valid PostgreSQL connection string.

```bash
# Run migrations
npm run prisma:migrate

# Seed initial data (Bikes & Admin User)
npm run prisma:seed
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📂 Project Structure

- `/app`: Next.js App Router pages and API routes.
  - `/check-in`: Public guest check-in flow.
  - `/admin`: Protected admin dashboard and agreement management.
  - `/api`: Backend endpoints for agreements, auth, and check-in.
- `/components`: Reusable UI components.
  - `/forms`: Complex form logic (CheckInForm, AgreementEditor).
  - `/pdf`: PDF document templates and viewers.
  - `/ui`: Shadcn/UI primitives (Button, Input, Card, etc.).
- `/lib`: Utilities, database client (`db.ts`), and env validation (`env.ts`).
- `/prisma`: Database schema (`schema.prisma`) and seed script.

---

## 🚢 Deployment

This project is optimized for deployment on **Vercel**.

1.  Push your code to a Git repository.
2.  Import the project into Vercel.
3.  Configure the Environment Variables in the Vercel dashboard.
4.  Deploy.

*Note: Ensure your database (Supabase) is accessible from Vercel's IP addresses or allow all IPs (0.0.0.0/0) if strictly necessary.*
