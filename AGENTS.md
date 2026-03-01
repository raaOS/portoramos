# AGENTS.md - AI Coding Agent Guide

> This file contains essential information for AI coding agents working on this project. It complements the human-oriented README and provides technical context for automated assistance.

---

## Project Overview

**portfolio-shared** is a personal portfolio website featuring a unique macOS-style desktop environment as its primary user interface. The site showcases creative design projects through an interactive, immersive experience rather than traditional web navigation.

### Key Characteristics

- **Language:** Primarily Indonesian (Bahasa Indonesia) with English i18n support
- **Architecture:** Next.js 16 App Router with React Server Components
- **Styling:** Tailwind CSS with custom CSS variables for theming
- **Data Storage:** JSON-based persistence via Firebase (optional) with local file fallbacks
- **Deployment Target:** Vercel

### Unique UX Approach

The homepage (`/`) renders a full-screen desktop environment featuring:
- Draggable desktop icons representing projects and apps
- Openable windows with macOS-style chrome (title bar, traffic lights)
- A dock with customizable icons and applications
- Dynamic wallpaper system with blur effects
- Sound effects for user interactions (startup, clicks, notifications)
- "Dynamic Island" style notifications with chat conversations
- WhatsApp-style chat interface for client testimonials

---

## Technology Stack

### Core Framework
| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.0.7 | React framework with App Router |
| React | 19.2.1 | UI library |
| TypeScript | 5.4.5 | Type safety |
| Tailwind CSS | 3.4.7 | Utility-first styling |

### Key Dependencies
- **Animation:** `framer-motion` - Primary animation library
- **State Management:** `@tanstack/react-query` - Server state, `swr` - Data fetching
- **Icons:** `lucide-react`, `@tabler/icons-react`
- **Particles:** `@tsparticles/react` - Background effects
- **PDF Generation:** `jspdf`, `jspdf-autotable`
- **Image Processing:** `sharp`, `html-to-image`
- **Drag & Drop:** `@dnd-kit/core`, `@dnd-kit/sortable`
- **Slider:** `rc-slider`

### AI & External Services
- **AI:** `@google/generative-ai` (Gemini API) for content generation
- **Firebase:** `firebase-admin` for database persistence
- **Telegram:** Bot integration for notifications and chat
- **GitHub:** API integration for file uploads and asset hosting

### Development Tools
- **Linting:** ESLint 9 with `eslint-config-next`
- **Testing:** Vitest (unit), Playwright (E2E)
- **Bundle Analysis:** `@next/bundle-analyzer`
- **Type Checking:** TypeScript strict mode

---

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── @modal/             # Parallel route for modals
│   ├── about/              # About page with OS components
│   │   └── _components/os/ # macOS-style desktop environment
│   ├── admin/              # Admin dashboard pages
│   ├── api/                # API routes (RESTful endpoints)
│   ├── contact/            # Contact page with chat interface
│   ├── cv/                 # CV/Resume page
│   ├── projects/           # Project listing and detail pages
│   ├── layout.tsx          # Root layout with providers
│   ├── page.tsx            # Homepage (renders DesktopEnvironment)
│   └── globals.css         # Global styles + Tailwind
├── components/
│   ├── admin/              # Admin-specific components
│   ├── chat/               # Chat-related components
│   ├── effects/            # Visual effect components
│   ├── features/           # Feature components (AI translator, etc)
│   ├── home/               # Homepage-specific components
│   ├── layout/             # Layout components (dock, navigation)
│   ├── projects/           # Project display components
│   ├── shared/             # Shared/common components
│   └── ui/                 # Base UI components (Button, Input, etc)
├── contexts/               # React Context providers
├── data/                   # JSON data files (content storage)
├── dictionaries/           # i18n translation files (id.ts, en.ts)
├── hooks/                  # Custom React hooks
├── lib/                    # Utilities and business logic
│   ├── __tests__/          # Unit tests
│   ├── security/           # Security utilities
│   ├── services/           # Data service layer
│   └── validations/        # Zod validation schemas
├── middleware/             # Next.js middleware (auth, CSRF)
├── styles/                 # Additional CSS files
├── tests/                  # Test setup
├── types/                  # TypeScript type definitions
└── utils/                  # Utility functions

scripts/                    # Build and utility scripts
├── core/                   # Core development scripts
├── deploy/                 # Deployment scripts
├── generators/             # Content generation scripts
├── media/                  # Media processing scripts
├── test/                   # Test runner scripts
└── utils/                  # Utility scripts

tests/e2e/                  # Playwright E2E tests
public/                     # Static assets
```

---

## Build and Development Commands

### Development
```bash
# Standard development server
npm run dev

# Fresh start (clear cache first)
npm run fresh-start

# Ultra fresh (fix webpack + clear cache)
npm run ultra-fresh

# Kill browser cache
npm run kill-cache
```

### Building
```bash
# Production build
npm run build

# Deploy build (includes pre-deploy checks)
npm run deploy
```

### Testing
```bash
# Unit tests (Vitest)
npm test
npm run test:watch
npm run test:coverage

# E2E tests (Playwright)
npm run test:e2e
npm run test:e2e:ui
```

### Utility Scripts
```bash
# Clear build cache
npm run clear-cache

# Fix webpack cache issues
npm run fix-webpack

# Ultra clean (removes all caches)
npm run ultra-clean

# Content sync
npm run sync

# Linting
npm run lint
```

---

## Code Style Guidelines

### TypeScript Conventions

1. **Strict Type Checking Enabled:**
   - `strict: true` in tsconfig.json
   - No implicit any
   - Strict null checks

2. **Naming Conventions:**
   - Components: PascalCase (e.g., `DesktopEnvironment.tsx`)
   - Hooks: camelCase with `use` prefix (e.g., `useDesktopIcons.ts`)
   - Utilities: camelCase (e.g., `chatUtils.ts`)
   - Types/Interfaces: PascalCase (e.g., `AboutData`, `ProjectType`)

3. **Import Patterns:**
   ```typescript
   // Use path aliases
   import { Button } from '@/components/ui/Button';
   import { useDesktopIcons } from '@/app/about/_components/os/hooks/useDesktopIcons';
   
   // Type imports (when type-only)
   import type { AboutData } from '@/types/about';
   ```

### Component Structure

1. **Server Components by Default:**
   - Most components are Server Components
   - Mark Client Components explicitly with `'use client'`
   - Keep client components as small as possible

2. **File Organization within Feature Folders:**
   ```
   feature-name/
   ├── page.tsx              # Route page (Server Component)
   ├── layout.tsx            # Route layout (if needed)
   ├── _components/          # Private components
   │   ├── ComponentName.tsx
   │   └── index.ts          # Re-exports
   ├── hooks/                # Custom hooks
   ├── utils/                # Utility functions
   └── types.ts              # Local types
   ```

3. **Styling Approach:**
   - Tailwind classes for most styling
   - CSS variables for theming (in globals.css)
   - CSS modules for complex scoped styles
   - `clsx` and `tailwind-merge` for conditional classes

### Data Fetching Patterns

1. **Server Components:**
   ```typescript
   // Parallel data fetching
   const [aboutData, projects] = await Promise.all([
     loadAboutData(),
     allProjectsAsync()
   ]);
   ```

2. **Cached Data with Service Layer:**
   ```typescript
   // Services handle caching and fallback logic
   import { aboutService } from '@/lib/services/aboutService';
   const data = await aboutService.getAboutData();
   ```

3. **Client-Side Fetching:**
   ```typescript
   // Use SWR or TanStack Query for client data
   import useSWR from 'swr';
   const { data } = useSWR('/api/projects', fetcher);
   ```

---

## Testing Instructions

### Unit Tests (Vitest)

- **Location:** `src/lib/__tests__/` and `src/lib/services/__tests__/`
- **Runner:** Vitest with jsdom environment
- **Setup:** `src/tests/setup.ts`

```typescript
// Example test
import { describe, it, expect } from 'vitest';
import { sanitizeInput } from '@/lib/security/sanitization';

describe('Security', () => {
  it('should sanitize HTML input', () => {
    const input = '<script>alert("xss")</script>';
    expect(sanitizeInput(input)).not.toContain('<script>');
  });
});
```

### E2E Tests (Playwright)

- **Location:** `tests/e2e/`
- **Config:** `playwright.config.ts`
- **Base URL:** `http://localhost:3000`

Key E2E test scenarios:
1. **crud-flow.spec.ts** - Full project CRUD via admin
2. **admin-reply.spec.ts** - Admin chat reply functionality
3. **grade-a.spec.ts** - Lighthouse Grade A verification

Environment variables required for E2E:
```bash
ADMIN_PASSWORD=your_admin_password
```

### Running Tests

```bash
# Unit tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage

# E2E
npm run test:e2e

# E2E with UI
npm run test:e2e:ui
```

---

## Security Considerations

### Authentication
- JWT-based admin authentication
- Token stored in `admin_token` cookie
- Token expiration handled client and server-side
- Protected routes defined in `src/middleware/constants.ts`

### Rate Limiting
- In-memory rate limiter (`src/lib/security/rate-limit.ts`)
- 100 attempts per IP before 15-minute lockout
- Automatic cleanup of old entries

### CSRF Protection
- CSRF tokens for form submissions
- Token validation in middleware

### Input Sanitization
- HTML sanitization for user input
- Path traversal prevention
- SQL injection prevention (using parameterized queries where applicable)

### Environment Variables (Secrets)
```bash
# Required
JWT_SECRET=min-32-characters-secret
ADMIN_PASSWORD_SCRYPT=scrypt-hashed-password

# External Services
TELEGRAM_BOT_TOKEN=your-bot-token
GEMINI_API_KEY=your-gemini-key
FIREBASE_PRIVATE_KEY=your-private-key
GITHUB_ACCESS_TOKEN=your-github-token
```

### Security Headers
Configured in `next.config.mjs`:
- `Strict-Transport-Security`
- `X-Frame-Options: SAMEORIGIN`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy`
- `Permissions-Policy`

---

## Data Architecture

### Content Storage

The project uses a dual-layer persistence strategy:

1. **Primary:** JSON files in `src/data/` (committed to repo)
2. **Optional:** Firebase Realtime Database (for multi-instance deployments)

### Content Service Pattern

```typescript
// Services abstract storage implementation
import { ContentService } from '@/lib/services/contentService';

const service = new ContentService<AboutData>('about.json', fallbackData);

// Read
const data = await service.getData();

// Write (with GitHub commit)
await service.saveData(newData, 'Commit message');
```

### Data Types

Key entities:
- **AboutData:** Profile, hero, OS configuration
- **Project:** Portfolio projects with gallery
- **Experience:** Work history
- **HardSkill:** Technical skills with concepts
- **Testimonial:** Client testimonials (chat format)
- **StickyNote:** Desktop sticky notes

### Caching Strategy

1. **Server-side:** React.cache for request deduplication
2. **Client-side:** SWR for data fetching with stale-while-revalidate
3. **ISR:** 60-second revalidation for pages

---

## Deployment

### Vercel Configuration

```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "framework": "nextjs"
}
```

### Pre-deployment Checklist

Run `npm run pre-deploy` which checks:
1. Required files exist (next.config.mjs, package.json, etc.)
2. Required environment variables set
3. Build output generated

### Performance Requirements

Lighthouse CI configuration (`lighthouserc.js`):
- Performance: 90+
- Accessibility: 90+
- Best Practices: 90+
- SEO: 90+
- First Contentful Paint: < 2s
- Largest Contentful Paint: < 3s

### Environment Variables for Production

```bash
# Site
NEXT_PUBLIC_SITE_URL=https://your-domain.com

# Auth
JWT_SECRET=your-jwt-secret
ADMIN_PASSWORD_SCRYPT=your-hashed-password

# Firebase (optional)
FIREBASE_PROJECT_ID=your-project
FIREBASE_CLIENT_EMAIL=your-email
FIREBASE_PRIVATE_KEY=your-key
FIREBASE_DATABASE_URL=your-database-url

# External APIs
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_CHAT_ID=your-chat-id
GEMINI_API_KEY=your-gemini-key
GITHUB_ACCESS_TOKEN=your-github-token
GITHUB_OWNER=your-username
GITHUB_REPO=your-repo

# Google
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-key
GOOGLE_PAGESPEED_API_KEY=your-key
```

---

## Common Tasks

### Adding a New Page

1. Create directory in `src/app/new-page/`
2. Add `page.tsx` with default export
3. Add `layout.tsx` if custom layout needed
4. Update navigation in dock/navigation components

### Adding an API Route

1. Create `src/app/api/feature-name/route.ts`
2. Export HTTP method handlers:
   ```typescript
   export async function GET(request: Request) { }
   export async function POST(request: Request) { }
   ```
3. Add to middleware constants if protected

### Adding a New Component

1. Determine location:
   - Feature-specific: `src/app/feature/_components/`
   - Shared: `src/components/shared/`
   - UI primitive: `src/components/ui/`
2. Use TypeScript interfaces for props
3. Add to barrel export if applicable

### Modifying Data Schema

1. Update TypeScript interface in `src/types/`
2. Update fallback data in `src/data/fallback-content.ts`
3. Update service layer if needed
4. Update validation schemas in `src/lib/validations/`

---

## Troubleshooting

### Build Issues

```bash
# Clear all caches
npm run ultra-clean

# Fix webpack issues
npm run fix-webpack

# Type issues
npx tsc --noEmit
```

### Development Issues

```bash
# Port already in use
npx kill-port 3000

# Hydration mismatch
# Check for mismatched client/server rendering
# Use suppressHydrationWarning where appropriate
```

### Cache Issues

```bash
# Clear Next.js cache
rm -rf .next/

# Clear all caches including node_modules
npm run ultra-clean && npm install
```

---

## Additional Notes

### Language
- Comments and UI text are primarily in **Indonesian (Bahasa Indonesia)**
- Some technical comments may be in English
- i18n support exists but Indonesian is the primary language

### Browser Support
- Chrome >= 90
- Firefox >= 90
- Safari >= 14
- Edge >= 90

### Code Generation
- AI-generated content uses Gemini API
- Scripts in `scripts/generators/` for seeding data
- AI helper components in admin for content generation

### Asset Handling
- Images: Stored in `public/assets/`
- Icons: Converted to WebP using icns conversion utility
- Sounds: WAV format, stored in `public/sounds/`
- Videos: MP4 with poster images

---

*Last updated: 2026-03-01*
