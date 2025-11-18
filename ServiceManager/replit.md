# Service Management Application

## Overview

A full-stack web application designed for technicians who maintain equipment and appliances for hotels, restaurants, and businesses. The system enables task management, client tracking, appliance maintenance history, service reporting, and inventory management. Built with React frontend, Express backend, PostgreSQL database via Neon, and follows Material Design principles with productivity-focused UI patterns.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System**
- React 18 with Vite as the build tool and development server
- TypeScript for type safety across the application
- Client-side routing via Wouter (lightweight React Router alternative)
- Component-based architecture with reusable UI components

**State Management & Data Fetching**
- TanStack Query (React Query) for server state management, caching, and automatic background refetching
- React hooks (useState, useContext) for local component state
- Custom query client configuration with infinite stale time and disabled automatic refetching for predictable data behavior

**UI Component System**
- Shadcn/ui component library (New York style variant) with Radix UI primitives
- Tailwind CSS for utility-first styling with custom design tokens
- Design system follows Material Design principles with Linear-inspired typography
- Custom CSS variables for theming with light/dark mode support via HSL color system
- Responsive layouts using Tailwind's mobile-first breakpoints

**Design Principles**
- Information hierarchy prioritized over decoration
- One-click access to critical actions for field technicians
- Scannable data tables optimized for mobile use
- Typography: Inter/Roboto for UI text, JetBrains Mono for technical data (serial numbers, IDs)
- Spacing system based on 8px grid (2, 4, 6, 8, 12, 16, 24 units)

### Backend Architecture

**Server Framework**
- Express.js with TypeScript
- RESTful API design pattern
- Middleware stack includes JSON parsing, URL encoding, and request/response logging
- Custom request logging captures method, path, status, duration, and response preview

**Database Layer**
- Drizzle ORM for type-safe database operations
- **PostgreSQL via Supabase** (migrated from Replit Neon database on October 28, 2025)
  - Connection via `@neondatabase/serverless` package (Supabase uses Neon-compatible driver)
  - Session Pooler connection for IPv4/IPv6 compatibility (`aws-1-eu-north-1.pooler.supabase.com`)
  - Environment variable `DATABASE_URL` contains Session Pooler connection string
- Schema-first approach with Drizzle-Zod for runtime validation
- Storage abstraction layer (IStorage interface) separating business logic from data access
- UUID primary keys generated via `uuid_generate_v4()` server-side

**Database Schema Design**

Core entities with VARCHAR UUID primary keys:
- **Profiles** (users): Authentication and technician profiles (username, password_hash, full_name, email, user_role)
- **Clients**: Business customer records with contact details (client_contact) and tax information (client_pib, client_pdv, client_account)
- **Appliances**: Equipment tracked per client with maker, type, model, serial, IGA number, picture URL, location details (city, building, room), and service dates
  - Location fields added October 28, 2025: appliance_city, appliance_building, appliance_room for precise equipment positioning across multiple client facilities
- **Tasks**: Service assignments with status workflow (pending → in_progress → completed), priority levels, and recurring task support
- **Reports**: Service completion documentation linked to tasks with spare_parts_used, work_duration, photos
- **Documents**: File metadata with related_to/related_id for flexible entity linking
- **Spare Parts**: Inventory management with part_number, manufacturer, quantity_in_stock, minimum_stock_level, unit_price, location

**Recurring Tasks Feature**
- Tasks support both one-time repairs and recurring inspections
- Recurrence patterns: weekly, monthly, quarterly, semi-annual, yearly
- Configurable intervals (e.g., every 2 weeks, every 3 months)
- Parent-child task relationships track recurring series history
- Automatic task generation via scheduled service (`recurringTasksService.ts`)
- Client-side daily check triggers task generation endpoint
- Next occurrence dates calculated based on pattern and interval

**API Routes Structure**
- `/api/clients` - CRUD operations for client management
- `/api/appliances` - Equipment management with client filtering
- `/api/tasks` - Task operations including recurring task generation endpoint
  - `POST /api/tasks/recurring/generate` - Generates new task instances from recurring patterns
  - `GET /api/tasks/recurring/due` - Returns recurring tasks due for generation
- `/api/reports` - Service report creation and retrieval
- `/api/documents` - Document metadata management
- `/api/spare-parts` - Inventory CRUD operations
- Standard HTTP methods (GET, POST, PATCH, DELETE) with appropriate status codes

**Development Setup**
- Hot module replacement via Vite middleware in development
- Custom error logging that exits process on Vite errors
- Development-only plugins for Replit integration (cartographer, dev banner, runtime error overlay)

### External Dependencies

**Database**
- **Supabase PostgreSQL**: Managed PostgreSQL database (migrated October 28, 2025)
  - Project region: EU North (Stockholm) - `aws-1-eu-north-1`
  - Connection via Neon-compatible serverless driver (`@neondatabase/serverless`)
  - Session Pooler for IPv4/IPv6 compatibility and connection pooling
  - Environment variable `DATABASE_URL` contains Session Pooler connection string
  - UUID extension (`uuid-ossp`) enabled for UUID generation
  - All tables created with complete indexes for optimal query performance

**ORM & Validation**
- **Drizzle ORM**: Type-safe database operations
  - Schema definition in TypeScript
  - Migrations stored in `/migrations` directory
  - Push-based deployment via `drizzle-kit push` command
- **Zod**: Runtime schema validation via `drizzle-zod` integration

**UI Component Libraries**
- **Radix UI**: Headless accessible component primitives (40+ components including dialogs, dropdowns, popovers, tabs, tooltips)
- **Shadcn/ui**: Pre-styled component system built on Radix
- **Lucide React**: Icon library for UI elements

**Styling**
- **Tailwind CSS**: Utility-first CSS framework
- **PostCSS & Autoprefixer**: CSS processing pipeline
- **class-variance-authority**: Type-safe variant styling
- **clsx & tailwind-merge**: Conditional class merging

**Utilities**
- **date-fns**: Date formatting and manipulation
- **cmdk**: Command palette component
- **wouter**: Lightweight client-side routing

**Development Tools**
- **tsx**: TypeScript execution for development server
- **esbuild**: Production bundling for server code
- **Replit plugins**: Development environment integration

**Third-Party Integration Readiness**
- Prepared endpoints for n8n automation webhook integration (not yet implemented)
- File storage infrastructure ready for Supabase Storage or similar services (currently local/database storage)

**Authentication Implementation** (Updated October 28, 2025)
- **Session-based authentication** using `express-session`
- Login endpoint: `POST /api/login` - validates credentials and creates server-side session
- Current user endpoint: `GET /api/user/me` - returns authenticated user from session
- Logout endpoint: `POST /api/logout` - destroys session
- **AuthContext** on frontend provides current user data via `useAuth` hook
- Header component displays user's full name instead of hardcoded placeholder
- Session persists across page navigation with 7-day cookie expiration
- Test user: username "lolo", password "lolo", full name "Punisa Raicevic"
- Note: Password validation is simplified (plaintext comparison) - production should use bcrypt hashing

**Internationalization (i18n)** (Added October 28, 2025)
- **Dual-language support**: English and Serbian (Српски)
- **LanguageContext** with React Context API for global language state management
- **LocalStorage persistence**: User's language preference saved and restored automatically
- **Translation files**: Comprehensive dictionaries in `client/src/i18n/en.ts` and `client/src/i18n/sr.ts` with 250+ keys
- **LanguageSelector component**: Dropdown with flag icons in header and login page
- **useTranslation() hook**: Provides type-safe access to translations throughout the app
- **Coverage**: All major UI elements, forms, dialogs, toast messages, and validation errors translated
- **Default language**: Serbian (Српски) to match Montenegro/Budva region
- Language switcher accessible on login page (top-right) and in header after login

**Mobile App Deployment - Capacitor** (Added October 30, 2025)
- **Capacitor 7.4.4** integrated for native Android (and iOS) app deployment
- **Web-first architecture**: Same React codebase powers web app, Android app, and iOS app
- **Android platform** configured and ready for Google Play Store submission
- **Configuration**: `capacitor.config.ts` with app ID `me.budva.tehniko` and app name "Tehniko System"
- **Build output**: Web assets compiled to `dist/public` and synced to native platforms
- **Android project**: Located in `android/` folder, ready to open in Android Studio
- **Default icons**: Capacitor default launcher icons installed (custom Tehniko branding can be added)
- **Web app unchanged**: Capacitor integration does NOT modify existing web application code
- **Next steps for Play Store**:
  1. Download and install Android Studio
  2. Open project: `npx cap open android`
  3. Build signed APK/AAB bundle
  4. Create Google Play Developer account ($25 one-time fee)
  5. Submit app to Google Play Store
- **Commands**:
  - `npm run build` - Build web application
  - `npx cap sync android` - Sync web assets to Android project
  - `npx cap open android` - Open Android project in Android Studio

**Backend Deployment - Replit Autoscale** (Configured October 31, 2025)
- **Deployment target**: Replit Autoscale for production backend hosting
- **Configuration**: `.replit` file configured with `deploymentTarget = "autoscale"`
- **Build command**: `npm run build` (builds both frontend and backend)
- **Run command**: `npm run start` (production Express server)
- **Port**: 5000 (configured in environment)
- **Android app API connection**:
  - `VITE_API_URL` environment variable in `.env` sets backend URL for Android app
  - In development (web), API URL is empty (same origin)
  - In production (Android), API URL points to Replit deployment (e.g., `https://username.repl.co`)
  - Modified `client/src/lib/queryClient.ts` to use `API_URL` prefix for all fetch requests
- **Pricing estimate**: $1-2/month for 5-20 technicians, practically free with Replit Core subscription ($25/month credits)
- **Deployment steps**: See `DEPLOYMENT_GUIDE.md` for complete instructions
- **Environment variables required**:
  - `DATABASE_URL` - Supabase PostgreSQL connection string
  - `SESSION_SECRET` - Express session secret
  - `VITE_SUPABASE_URL` - Supabase project URL
  - `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
  - `VITE_API_URL` - Backend URL for Android app (only in `.env` for build, not in Replit Secrets)