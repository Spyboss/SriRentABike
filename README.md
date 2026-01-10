# SriRentABike Digital Rental Agreement System

A modern, mobile-first digital rental agreement system that replaces paper workflows for bike rental businesses. Built with React, TypeScript, Express, and Supabase.

## Features

- **Digital Agreements**: Complete digital rental agreement workflow
- **Electronic Signatures**: Touch-friendly signature capture on mobile devices
- **Guest Access**: Secure guest links for tourists to fill agreements
- **Admin Dashboard**: Comprehensive admin panel for managing agreements
- **PDF Generation**: Professional PDF generation with company branding
- **Mobile First**: Optimized for mobile devices and tablets
- **Secure Authentication**: JWT-based authentication for admin users

## Mobile Optimization Strategy

The application follows a strict mobile-first design philosophy to ensure seamless operation on all devices, particularly for on-the-go rental management.

### Design Decisions
- **Fluid Layouts**: Uses relative units (%, rem, vh/vw) instead of fixed pixels to adapt to any screen width.
- **Touch Targets**: All interactive elements (buttons, inputs, links) have a minimum touch target size of 48x48px to accommodate finger taps.
- **Responsive Tables**: Admin data tables use a priority-based column visibility pattern. Less critical columns (passport no, email, etc.) are hidden on smaller screens (`hidden sm:table-cell`), ensuring the layout never breaks horizontally.
- **Typography**: Font sizes are optimized for readability on small screens without zooming.
- **Navigation**: Simplified navigation bars and menus for mobile contexts.
- **Performance**: 
  - Images use `loading="lazy"` for better initial load times.
  - Critical rendering path optimized via Tailwind CSS.
  - Assets are minified during the build process.

### Supported Breakpoints
- **Mobile**: < 640px (Default/Base styles)
- **Tablet**: 640px - 1024px (`sm:`, `md:` prefixes)
- **Desktop**: > 1024px (`lg:`, `xl:` prefixes)

## Branding Configuration

The application uses a centralized branding configuration.

- **Frontend Config**: `src/config/branding.ts`
- **Backend Config**: `api/src/config/branding.ts`

You can update the `logo.url`, `companyName`, and other branding assets in these files. The logo is automatically used across:
- Header components
- Authentication screens
- PDF exports
- Public forms

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Zustand for state management
- React Router for navigation
- React Signature Canvas for electronic signatures

### Backend
- Node.js with Express and TypeScript
- Supabase for database and authentication
- JWT for secure token management
- Puppeteer for PDF generation
- Custom Request Validation
- Rate limiting for API protection

### Database
- PostgreSQL via Supabase
- Row Level Security (RLS) policies
- Optimized indexes for performance

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm or pnpm
- Supabase account

### 1. Clone and Install
```bash
git clone <repository-url>
cd SriRentABike
npm install
cd api && npm install && cd ..
```

### 2. Environment Setup
Create `.env` files for both frontend and backend:

**Frontend (.env)**
```env
VITE_API_URL=http://localhost:3001/api
# Frontend does not directly use Supabase; omit unused variables
```

**Backend (api/.env)**
```env
PORT=3001
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=24h
NODE_ENV=development
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
MAX_FILE_SIZE=5242880
UPLOAD_DIR=uploads
FRONTEND_URL=http://localhost:5173
```

### 3. Database Setup
1. Create a new Supabase project
2. Use the SQL editor to run migrations in order:
   - `api/supabase/migrations/20241201_initial_schema.sql`
   - `api/supabase/migrations/20241212_admin_controls.sql`
   - `api/supabase/migrations/20250104_add_requested_model.sql`
3. Create the public storage bucket automatically:
   ```bash
   cd api
   npm run setup:supabase
   ```
4. Create an initial admin user via API:
   ```bash
   curl -X POST http://localhost:3001/api/auth/setup-admin \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@example.com","password":"ChangeMe123!"}'
   ```

### 4. Development
```bash
# Start backend
cd api && npm run dev

# Start frontend (in new terminal)
npm run dev
```

### 5. Build for Production
```bash
# Build backend
cd api && npm run build

# Build frontend
npm run build
```

## Deployment

### Frontend (Cloudflare Pages)
1. Connect your GitHub repository to Cloudflare Pages
2. Set build command: `npm run build`
3. Set build output directory: `dist`
4. Add environment variables in Cloudflare dashboard (e.g., `VITE_API_URL`)
5. Deploy!

### Backend (Railway)
1. Connect your GitHub repository to Railway
2. Railway will auto-detect the Node.js app in the `api` folder
3. Add environment variables in Railway dashboard
4. Deploy!

### Alternative Deployment Options

#### Vercel (Frontend)
1. Connect repository to Vercel
2. Framework preset: Vite
3. Build command: `npm run build`
4. Output directory: `dist`
5. Add environment variables

#### Heroku (Backend)
1. Create Heroku app
2. Set buildpack: `heroku/nodejs`
3. Add PostgreSQL addon
4. Configure environment variables
5. Deploy with `git push heroku main`

## API Documentation

### Authentication
- `POST /api/auth/admin/login` - Admin login
- `GET /api/auth/me` - Current user
- `POST /api/auth/setup-admin` - Create initial admin (development)

### Agreements
- `GET /api/agreements` - List all agreements (admin)
- `GET /api/agreements/:id` - Get specific agreement (admin)
- `POST /api/agreements` - Create new agreement (guest)
- `PUT /api/agreements/:id` - Update agreement (admin)
- `DELETE /api/agreements/:id` - Delete agreement (admin)
- `GET /api/agreements/:id/audit` - Agreement audit events (admin)
- `GET /api/agreements/public/:reference` - Public agreement status

### Guest Links
- `POST /api/guest-links` - Create guest access link (admin)
- `GET /api/guest-links/validate/:token` - Validate guest token
- `GET /api/guest-links/agreement/:token` - Agreement details by token
- `POST /api/guest-links/use/:token` - Mark token as used

### PDF
- `POST /api/pdf/generate/:agreementId` - Generate agreement PDF (admin)
- `GET /api/pdf/download/:agreementId` - Download agreement PDF (admin)
- `GET /api/pdf/url/:agreementId` - Get PDF URL (admin)

### Bikes
- `GET /api/bikes` - List bikes (admin)
- `GET /api/bikes/available` - List available bikes (admin)
- `POST /api/bikes` - Create bike (admin)
- `PUT /api/bikes/:id` - Update bike (admin)
- `POST /api/bikes/:id/archive` - Archive bike (admin)
- `DELETE /api/bikes/:id` - Delete bike (admin)
- `GET /api/bikes/:id/meta` - Get bike metadata (admin)
- `PUT /api/bikes/:id/meta` - Update bike metadata (admin)
- `POST /api/bikes/:id/docs` - Upload bike documents (admin)
- `GET /api/bikes/:id/docs` - List bike documents (admin)

### Settings
- `GET /api/settings/pricing` - Get pricing configuration (public)
- `PUT /api/settings/pricing` - Update pricing configuration (admin)
- `GET /api/settings/daily-rate` - Get daily rate (public)
- `PUT /api/settings/daily-rate` - Update daily rate (admin)

### Health
- `GET /api/health` - Service health check

## Database Schema

### Tables
- `users` - Admin users
- `agreements` - Rental agreements (includes `pdf_status`, `deleted_at`, `updated_at`)
- `guest_links` - Guest access tokens
- `bikes` - Bike inventory
- `audit_events` - Action audit log

See technical architecture documentation for complete schema.

## Security Features

- JWT-based authentication
- Row Level Security (RLS) policies
- Rate limiting on API endpoints
- Custom request validation
- Secure file upload handling
- Environment variable protection
- Service role key used server-side only for Supabase operations

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For support, email support@srirentabike.com or create an issue in the repository.
