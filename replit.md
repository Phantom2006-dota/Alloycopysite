# BAUHAUS Website

## Overview

BAUHAUS is a Nigerian cultural company operating across multiple verticals: Books, Films & Documentaries, Publishing, and Tourism. This website serves as their digital presence to showcase their catalog and services. The application is a clean, minimalist marketing website built with React and Vite, emphasizing professional presentation and intuitive navigation inspired by modern design aesthetics.

## User Preferences

Preferred communication style: Simple, everyday language.

## Running on Replit

- **Workflow**: "Start application" runs `npm run dev` (integrated mode — Express serves the API and Vite dev-serves the frontend on port 5000).
- **Database**: Uses Replit's built-in PostgreSQL (`DATABASE_URL` is set automatically as an env var). Schema is pushed with `npm run db:push` (drizzle-kit); it does not use the `migrations/` SQL files at runtime.
- **Seed data**: `npm run db:seed` creates a `super_admin` user (`admin01` / `admin123`), default categories, and sample products. Safe to re-run — it skips creation if data already exists.
- **Optional integrations not yet configured**: Cloudinary (file/media uploads — set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`) and Stripe (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`). The site and admin panel work without them; uploads and payments will fail until they're set.
- Repo also ships config for other hosts (Docker, Fly.io, Netlify, Vercel, cPanel tarballs) — these are unused on Replit and can be ignored unless you want to deploy elsewhere.

## System Architecture...

### Frontend Architecture

**Framework & Build System**
- React 18.3.1 with functional components and hooks pattern
- Vite 7.2.4 as the build tool for fast development and optimized production builds
- TypeScript for type safety (configured with relaxed strictness for flexibility)
- React Router DOM 7.9.6 for client-side routing with BrowserRouter

**Component Organization**
- Page-based routing with dedicated page components (Index, About, Books, TV, Film, Publishing, Events, Team, Contact, NotFound)
- Shared Layout component wrapping Header and Footer for consistent site structure
- Reusable MediaCarousel component using Embla Carousel for content showcases
- shadcn/ui component library integration for pre-built UI primitives

**Styling Architecture**
- Tailwind CSS 4.1.17 with utility-first approach
- CSS custom properties (CSS variables) for theming via `index.css`
- Light/dark theme support using next-themes package
- Custom design tokens including:
  - **Light Mode**: Pure white (#FFFFFF) backgrounds with black (#000000) text
  - **Dark Mode**: Pure black (#000000) backgrounds with white (#FFFFFF) text
  - **Accent Color Palette** (for highlights, buttons, icons, borders):
    - Yellow: #ffd51e, Red: #ff3131, Purple: #9655f0, #9c43fa
    - Green: #7ee868, Teal: #2fdeab, #3faf90, Cyan: #57abbe
    - Blue: #4ea8f1, Magenta: #cc3bba, Lime: #24dc32
    - Orange: #f15d24, Pink: #e97bff, Fuchsia: #dd07a6
  - Typography: Inter (sans-serif) and Playfair Display (serif) from Google Fonts
  - Custom animations: fadeIn, slideUp for smooth page transitions
- Clean, minimalist design with subtle accent color highlights

**State Management**
- React hooks (useState, useEffect) for local component state
- TanStack React Query for data fetching and caching capabilities
- ThemeProvider context for global theme state

**Responsive Design Strategy**
- Mobile-first approach with responsive breakpoints
- Custom `useIsMobile` hook for SSR-safe responsive behavior
- Embla Carousel configured with responsive slide counts
- Hamburger menu with animated transitions for mobile navigation

**Code Quality & Tooling**
- ESLint with TypeScript support for code linting
- Relaxed TypeScript configuration (strict mode disabled) for faster development
- Path aliases configured (`@/*` points to `src/*`) for cleaner imports
- PostCSS with Autoprefixer for CSS processing

### External Dependencies

**UI Component Libraries**
- Radix UI primitives (accordion, alert-dialog, avatar, checkbox, dialog, dropdown-menu, hover-card, label, menubar, navigation-menu, popover, progress, radio-group, scroll-area, select, separator, slider, switch, tabs, toast, toggle, tooltip)
- shadcn/ui configuration for component customization
- Embla Carousel React (8.6.0) for media carousels
- Lucide React (0.462.0) for icon system

**Form & Validation**
- React Hook Form with @hookform/resolvers for form handling
- cmdk for command menu functionality
- input-otp for OTP input components
- react-day-picker with date-fns for date selection

**Theming & Styling**
- next-themes (0.4.6) for theme management
- class-variance-authority (CVA) for component variant management
- clsx and tailwind-merge for conditional class names

**Data Management**
- TanStack React Query (5.83.0) for async state management

**Development Tools**
- Vite React SWC plugin for fast refresh
- TypeScript ESLint for linting
- React Router for navigation

**Build Configuration**
- Vite configured to serve on 0.0.0.0:5000 for network access
- Path resolution aliases for clean imports
- Development and production build modes

**Asset Management**
- Public folder for static assets (robots.txt, logos)
- Logo variants for light/dark themes:
  - Light mode: `src/assets/light.png` (blue/black Bauhaus Production logo)
  - Dark mode: `src/assets/dark.png` (yellow/red Bauhaus Production logo)
- Theme-aware logo switching in Header and Footer components

## CMS (Content Management System)

### Database Schema
PostgreSQL database with Drizzle ORM:
- **users**: Admin users with roles (super_admin, editor, author, contributor)
- **articles**: Blog posts with categories, tags, and SEO metadata
- **categories**: Article categories (Books, Films, Events, Publishing, News, TV, Tourism)
- **tags**: Article tags with many-to-many relationship
- **media_items**: Books, films, TV shows catalog
- **team_members**: Company team members
- **events**: Company events and screenings
- **uploads**: Media library for uploaded files

### Backend API
Express.js backend running on port 5000:
- JWT authentication with role-based access control
- API key authentication for separable backend mode
- RESTful API endpoints for all content types
- Cloudinary integration for media storage
- Pagination and filtering support

### Separable Backend Architecture
The backend can be hosted separately from the frontend and connected via API key:

**Environment Variables:**
- `BACKEND_MODE`: Set to "standalone" to disable frontend serving
- `CMS_API_KEY`: Required API key for frontend-to-backend communication
- `ALLOWED_ORIGINS`: Comma-separated list of allowed CORS origins

**Running Modes:**
1. **Integrated Mode** (default): `npm run dev` - Serves both frontend and backend
2. **Standalone Mode**: `npm run start:standalone` - Backend only with API key required

**Frontend Configuration:**
Set these in `.env` for the frontend:
- `VITE_API_URL`: Full URL to your backend API (e.g., https://api.example.com/api)
- `VITE_API_KEY`: Your CMS API key

### Cloudinary Media Storage
Media uploads are stored in Cloudinary instead of local storage:

**Required Secrets:**
- `CLOUDINARY_CLOUD_NAME`: Your Cloudinary cloud name
- `CLOUDINARY_API_KEY`: Your Cloudinary API key
- `CLOUDINARY_API_SECRET`: Your Cloudinary API secret

**Features:**
- Automatic image optimization and thumbnails
- CDN delivery for fast media access
- Support for images and documents

### Admin Panel
Located at `/admin`:
- **Login**: `/admin/login` (seeded credentials: admin01/admin123 — see "Running on Replit" below)
- **Dashboard**: `/admin` - Overview with stats and quick actions
- **Articles**: `/admin/articles` - Article management with CRUD
- **Article Editor**: `/admin/articles/:id` - Rich text editing with SEO settings
- **Categories**: `/admin/categories` - Category management for articles
- **Media**: `/admin/media` - Books, films, and TV shows catalog management
- **Team**: `/admin/team` - Team member profiles management
- **Events**: `/admin/events` - Event scheduling and management
- **Uploads**: `/admin/uploads` - Media library for file uploads
- **Settings**: `/admin/settings` - General CMS settings

### Dynamic Content Pages
The frontend pages now fetch content from the database:
- **Home (Index)**: Displays featured media items (books, films, TV shows)
- **Books**: Shows book catalog from database with fallback content
- **Film**: Shows film catalog from database with fallback content
- **TV**: Shows TV shows from database with fallback content
- **Events**: Shows upcoming and past events from database

### Blog Frontend
Public-facing blog pages:
- **Blog List**: `/blog` - Articles with category filters and search
- **Blog Article**: `/blog/:slug` - Full article with author info and sharing

### User Roles
- **super_admin**: Full access to all features
- **editor**: Content management, can publish articles
- **author**: Can create/edit own articles, cannot publish
- **contributor**: Limited access

### API Endpoints
All endpoints are prefixed with `/api`:
- **Health**: `GET /api/health` - Server health check
- **Auth**: `/api/auth/login`, `/api/auth/register`, `/api/auth/me`
- **Articles**: `/api/articles` - Full CRUD with pagination
- **Categories**: `/api/categories`
- **Tags**: `/api/tags`
- **Media Items**: `/api/media` - Books, films, TV content
- **Team**: `/api/team` - Team members
- **Events**: `/api/events`
- **Uploads**: `/api/uploads` - Media library with Cloudinary