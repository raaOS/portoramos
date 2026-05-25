'use client';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-12 border-t border-gray-200 py-8 text-sm text-gray-600 transition-colors duration-300 dark:border-white dark:text-white">
      <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
        <div className="flex items-center gap-6">
          <span className="font-medium">© {year} Ramos</span>
          {/* Footer Navigation - Removed as per user request */}
        </div>
        <span>All rights reserved.</span>
      </div>
    </footer>
  );
}
