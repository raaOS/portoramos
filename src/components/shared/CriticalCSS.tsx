/**
 * Critical CSS Inlining for Performance 100
 * This component injects critical CSS to prevent render-blocking
 */
export default function CriticalCSS() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
          /* Critical CSS for Above-the-fold Content */
          :root {
            --bg: #050505;
            --fg: #f5f5f5;
          }
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          html {
            scroll-behavior: auto;
          }
          
          body {
            background: var(--bg);
            color: var(--fg);
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            overflow-x: hidden;
            min-height: 100vh;
          }
          
          /* Prevent FOUC */
          .font-sans {
            font-family: var(--font-sans), system-ui, sans-serif;
          }
          
          /* Critical layout styles */
          #main-content {
            min-height: 100vh;
            width: 100%;
          }
          
          /* Loading state for LCP */
          .lcp-loading {
            background: linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%);
            position: fixed;
            inset: 0;
            z-index: -1;
          }
          
          /* Accessibility - Focus visible */
          :focus-visible {
            outline: 2px solid #2563eb;
            outline-offset: 2px;
          }
          
          /* Reduced motion */
          @media (prefers-reduced-motion: reduce) {
            *, *::before, *::after {
              animation-duration: 0.01ms !important;
              animation-iteration-count: 1 !important;
              transition-duration: 0.01ms !important;
            }
          }
        `,
      }}
    />
  );
}
