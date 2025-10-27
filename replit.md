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
- PostgreSQL via Neon serverless driver with WebSocket support
- Schema-first approach with Drizzle-Zod for runtime validation
- Storage abstraction layer (IStorage interface) separating business logic from data access

**Database Schema Design**

Core entities with UUID primary keys:
- **Users**: Authentication and technician profiles (username, password, full name, email, role)
- **Clients**: Business customer records with contact details and tax information (PIB, PDV, account numbers)
- **Appliances**: Equipment tracked per client with make/model, serial numbers, installation dates
- **Tasks**: Service assignments with status workflow (pending → in_progress → completed), priority levels, and recurring task support
- **Reports**: Service completion documentation linked to tasks
- **Files**: Attachments associated with tasks or reports

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
- `/api/reports` - Service report creation and retrieval
- `/api/files` - File attachment handling
- Standard HTTP methods (GET, POST, PATCH, DELETE) with appropriate status codes

**Development Setup**
- Hot module replacement via Vite middleware in development
- Custom error logging that exits process on Vite errors
- Development-only plugins for Replit integration (cartographer, dev banner, runtime error overlay)

### External Dependencies

**Database**
- **Neon PostgreSQL**: Serverless PostgreSQL provider
  - Connection via `@neondatabase/serverless` package with WebSocket support
  - Environment variable `DATABASE_URL` required for connection
  - Connection pooling enabled for efficient resource usage

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

**Authentication Status**
- Current implementation uses mock authentication flow
- Schema supports user roles and password storage
- Ready for implementation of proper authentication system (JWT, session-based, or OAuth)