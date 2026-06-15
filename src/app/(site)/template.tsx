/**
 * View Transitions dihandle native browser via next-view-transitions (root layout).
 * Animasi didefinisikan di src/app/globals.css → section "page view transitions".
 * Template cukup passthrough — tidak perlu JS animation di sini.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
