# Requirements Document: Vercel Cold Start Optimization

## Introduction

This document specifies requirements for optimizing cold start performance of the portfolio-shared homepage on Vercel. The current implementation loads a full OS desktop environment immediately, causing slow Time to First Byte (TTFB), First Contentful Paint (FCP), and Largest Contentful Paint (LCP). The optimization will restructure the homepage to use Node/ISR rendering, consolidate data fetching, implement progressive loading, and optimize the root layout to move non-essential components to specific routes.

The system targets hyper-fast cold start times by reducing initial bundle size, improving edge caching utilization, and lazy-loading heavy OS components after skeleton/wallpaper first appears.

## Glossary

- **Homepage**: The root route (`/`) of the portfolio-shared application
- **OS_Desktop_Environment**: The full macOS-style desktop interface with windows, dock, wallpaper, and interactive elements
- **Cold_Start**: The first request to a serverless function after it has been idle, requiring initialization
- **ISR**: Incremental Static Regeneration - Next.js feature for static page regeneration with revalidation
- **Root_Layout**: The top-level layout component at `src/app/layout.tsx`
- **Site_Layout**: The site-specific layout component at `src/app/(site)/layout.tsx`
- **Homepage_Data_Loader**: The consolidated data fetching function in `src/lib/loaders.ts`
- **Data_Backend_Fetch**: A network request to Cloudflare D1 for content data
- **Skeleton_UI**: A minimal loading interface showing wallpaper and basic structure
- **Bundle_Analyzer**: Next.js tool for analyzing JavaScript bundle sizes
- **Edge_Cache**: Vercel's CDN cache layer for serving static and ISR content
- **SoundConfigLoader**: Component that loads audio configuration for the OS environment
- **Global_Dock**: The application dock component visible across multiple routes
- **Window_Manager**: The system managing draggable windows in the OS environment
- **Monitor_Component**: The desktop monitor/display wrapper component
- **About_Data**: User profile and configuration data from Cloudflare D1
- **TTFB**: Time to First Byte - time from request to first byte of response
- **FCP**: First Contentful Paint - time until first content renders
- **LCP**: Largest Contentful Paint - time until largest content element renders
- **Core_Web_Vitals**: Google's metrics for measuring user experience (LCP, FID, CLS)

## Requirements

### Requirement 1: Homepage Node/ISR Rendering

**User Story:** As a visitor, I want the homepage to load quickly on first visit, so that I can access the portfolio content without delay.

#### Acceptance Criteria

1. THE Homepage SHALL render using Node.js with ISR (not client-side only)
2. THE Homepage SHALL maintain `revalidate = 60` for edge caching
3. WHEN a visitor requests the Homepage, THE Homepage SHALL return server-rendered HTML within 800ms (p95)
4. THE Homepage SHALL pass `npm run build` without errors before deployment
5. FOR ALL valid Homepage requests, THE Edge_Cache SHALL serve cached responses when available

### Requirement 2: Root Layout Optimization

**User Story:** As a developer, I want the root layout to only include essential components, so that routes not requiring OS features load faster.

#### Acceptance Criteria

1. THE Root_Layout SHALL NOT include SoundConfigLoader
2. THE Root_Layout SHALL NOT include Global_Dock configuration
3. THE Root_Layout SHALL NOT include Window_Manager initialization
4. THE Root_Layout SHALL NOT include Monitor_Component
5. THE Root_Layout SHALL NOT load About_Data for non-OS routes
6. THE Site_Layout SHALL include SoundConfigLoader only for routes requiring audio
7. THE Site_Layout SHALL include Global_Dock only for routes requiring dock navigation
8. THE Site_Layout SHALL include Window_Manager only for routes with window functionality
9. WHEN a route requires OS features, THE Site_Layout SHALL load the necessary components
10. WHEN a route does not require OS features, THE Site_Layout SHALL omit OS-specific components

### Requirement 3: Cache Control Optimization

**User Story:** As a visitor, I want the homepage to be served from edge cache, so that subsequent visits load instantly.

#### Acceptance Criteria

1. THE Homepage SHALL NOT set custom `Cache-Control` headers with `s-maxage=0`
2. THE Homepage SHALL use default Next.js ISR cache headers
3. THE Homepage SHALL allow edge caching with `s-maxage=3600`
4. THE Homepage SHALL include `stale-while-revalidate` directive
5. WHEN the Homepage is requested, THE Edge_Cache SHALL serve from cache when valid

### Requirement 4: Consolidated Data Fetching

**User Story:** As a developer, I want homepage data fetched in a single optimized payload, so that cold start time is minimized.

#### Acceptance Criteria

1. THE Homepage_Data_Loader SHALL fetch all required data in one consolidated operation
2. THE Homepage_Data_Loader SHALL NOT make 5 separate parallel Data_Backend_Fetch calls
3. THE Homepage_Data_Loader SHALL combine about, projects, experience, skills, and testimonials into a single cache entry
4. THE Homepage_Data_Loader SHALL use a single Cloudflare D1 query when possible
5. THE Homepage_Data_Loader SHALL complete data fetching within 400ms (p95)
6. WHEN Homepage_Data_Loader executes, THE system SHALL minimize Cloudflare D1 request overhead
7. THE Homepage_Data_Loader SHALL cache the consolidated payload with TTL of 60 seconds

### Requirement 5: Progressive OS Component Loading

**User Story:** As a visitor, I want to see the wallpaper and skeleton immediately, so that the page feels responsive while heavy components load.

#### Acceptance Criteria

1. THE Homepage SHALL render Skeleton_UI before loading OS_Desktop_Environment
2. THE Skeleton_UI SHALL display wallpaper within 200ms of FCP
3. THE Skeleton_UI SHALL display basic layout structure before interactive components
4. THE OS_Desktop_Environment SHALL lazy-load after Skeleton_UI appears
5. THE Homepage SHALL achieve FCP within 1.2 seconds (p95)
6. THE Homepage SHALL achieve LCP within 2.5 seconds (p95)
7. WHEN Skeleton_UI is visible, THE system SHALL begin loading OS_Desktop_Environment in background
8. WHEN OS_Desktop_Environment loads, THE system SHALL smoothly transition from Skeleton_UI

### Requirement 6: Bundle Size Verification

**User Story:** As a developer, I want to verify bundle sizes after optimization, so that I can confirm the optimization achieved its goals.

#### Acceptance Criteria

1. WHEN `npm run build` succeeds, THE developer SHALL run `ANALYZE=true npm run build`
2. THE Bundle_Analyzer SHALL generate a visual report of bundle sizes
3. THE Homepage initial bundle SHALL be less than 200KB (gzipped)
4. THE OS_Desktop_Environment bundle SHALL be code-split from Homepage bundle
5. THE Bundle_Analyzer report SHALL show separate chunks for lazy-loaded components

### Requirement 7: Performance Metrics Improvement

**User Story:** As a visitor, I want the homepage to load with excellent Core Web Vitals scores, so that I have a smooth browsing experience.

#### Acceptance Criteria

1. THE Homepage SHALL achieve TTFB less than 600ms (p75)
2. THE Homepage SHALL achieve FCP less than 1.8 seconds (p75)
3. THE Homepage SHALL achieve LCP less than 2.5 seconds (p75)
4. THE Homepage SHALL maintain Cumulative Layout Shift (CLS) less than 0.1
5. THE Homepage SHALL achieve First Input Delay (FID) less than 100ms
6. WHEN measured by Lighthouse, THE Homepage SHALL score 90+ for Performance
7. WHEN measured by Core Web Vitals, THE Homepage SHALL pass all three metrics (LCP, FID, CLS)

### Requirement 8: Backward Compatibility

**User Story:** As a developer, I want existing functionality preserved, so that the optimization does not break current features.

#### Acceptance Criteria

1. THE Homepage SHALL maintain all existing OS_Desktop_Environment features
2. THE Homepage SHALL maintain all existing data display functionality
3. THE Homepage SHALL maintain all existing interactive elements after full load
4. THE Homepage SHALL maintain ISR revalidation behavior
5. WHEN optimization is complete, THE system SHALL pass all existing E2E tests
6. WHEN optimization is complete, THE system SHALL pass all existing unit tests

### Requirement 9: Cloudflare D1 Data Optimization

**User Story:** As a developer, I want Cloudflare D1 queries optimized, so that data fetching contributes minimally to cold start time.

#### Acceptance Criteria

1. THE Homepage_Data_Loader SHALL use Cloudflare D1 request reuse when available
2. THE Homepage_Data_Loader SHALL minimize Cloudflare API request overhead
3. THE Homepage_Data_Loader SHALL use shallow queries when full data is not required
4. THE Homepage_Data_Loader SHALL implement request deduplication for concurrent requests
5. WHEN multiple Homepage requests occur simultaneously, THE system SHALL deduplicate Cloudflare D1 queries
6. THE Homepage_Data_Loader SHALL use CacheManager for in-memory caching

### Requirement 10: Route-Specific Component Loading

**User Story:** As a developer, I want components loaded only on routes that need them, so that non-OS routes remain lightweight.

#### Acceptance Criteria

1. THE `/projects` route SHALL NOT load OS_Desktop_Environment components
2. THE `/contact` route SHALL NOT load OS_Desktop_Environment components
3. THE `/cv` route SHALL NOT load OS_Desktop_Environment components
4. THE `/about` route SHALL load OS_Desktop_Environment components
5. THE Homepage (`/`) SHALL load OS_Desktop_Environment components
6. WHEN a route does not use OS features, THE system SHALL NOT include OS component bundles
7. WHEN a route uses OS features, THE system SHALL load OS components on demand

### Requirement 11: Build Verification

**User Story:** As a developer, I want the build process to verify optimization success, so that regressions are caught before deployment.

#### Acceptance Criteria

1. THE build process SHALL complete `npm run build` successfully
2. THE build process SHALL verify Homepage bundle size is within limits
3. THE build process SHALL verify no TypeScript errors exist
4. THE build process SHALL verify no ESLint errors exist
5. IF Homepage bundle exceeds 200KB gzipped, THEN THE build process SHALL emit a warning
6. THE build process SHALL generate bundle analysis when `ANALYZE=true`

### Requirement 12: Skeleton UI Implementation

**User Story:** As a visitor, I want to see a meaningful loading state immediately, so that I know the page is loading.

#### Acceptance Criteria

1. THE Skeleton_UI SHALL display the desktop wallpaper
2. THE Skeleton_UI SHALL display a loading indicator
3. THE Skeleton_UI SHALL use minimal JavaScript (less than 10KB)
4. THE Skeleton_UI SHALL render from server-side HTML
5. THE Skeleton_UI SHALL maintain the same aspect ratio as OS_Desktop_Environment
6. WHEN Skeleton_UI renders, THE system SHALL not cause layout shift during transition to full OS
7. THE Skeleton_UI SHALL include critical CSS inline for immediate rendering

## Notes

### Implementation Priorities

1. **Phase 1:** Restore Homepage to Node/ISR rendering and verify build passes
2. **Phase 2:** Optimize Root_Layout and Site_Layout component distribution
3. **Phase 3:** Remove custom Cache-Control headers preventing edge caching
4. **Phase 4:** Consolidate Homepage_Data_Loader into single payload/cache
5. **Phase 5:** Implement Skeleton_UI and lazy-load OS_Desktop_Environment
6. **Phase 6:** Run bundle analysis and verify size improvements

### Performance Targets Summary

| Metric | Current (Estimated) | Target | Measurement |
|--------|---------------------|--------|-------------|
| TTFB | ~2000ms | <600ms (p75) | Vercel Analytics |
| FCP | ~3000ms | <1.8s (p75) | Lighthouse |
| LCP | ~5000ms | <2.5s (p75) | Lighthouse |
| Initial Bundle | ~400KB | <200KB | Bundle Analyzer |
| Data Backend Fetches | 5 parallel | 1 consolidated | Code Review |

### Technical Constraints

- Must maintain Next.js 16.2.x compatibility
- Must maintain React 19 compatibility
- Must preserve existing Cloudflare D1 data structure
- Must maintain ISR revalidation = 60 seconds
- Must not break existing E2E tests
- Must maintain TypeScript strict mode compliance

### Testing Strategy

- Unit tests for Homepage_Data_Loader consolidation
- E2E tests for Homepage load performance
- Visual regression tests for Skeleton_UI transition
- Bundle size tests in CI/CD pipeline
- Lighthouse CI for Core Web Vitals monitoring

