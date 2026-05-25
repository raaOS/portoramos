// Shared Observer Manager to prevent memory leaks (1 observer instead of N)
class SharedObserver {
  private observer: IntersectionObserver | null = null;
  private callbacks = new Map<Element, (entry: IntersectionObserverEntry) => void>();

  constructor() {
    if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const cb = this.callbacks.get(entry.target);
            if (cb) cb(entry);
          });
        },
        {
          threshold: 0.25,
          rootMargin: '100px 0px 100px 0px',
        }
      );
    }
  }

  observe(element: Element, callback: (entry: IntersectionObserverEntry) => void) {
    if (!this.observer) return;
    this.callbacks.set(element, callback);
    this.observer.observe(element);
  }

  unobserve(element: Element) {
    if (!this.observer) return;
    this.callbacks.delete(element);
    this.observer.unobserve(element);
  }
}

// Singleton instance
export const sharedMediaObserver = new SharedObserver();
