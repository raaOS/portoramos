"use client"
import { usePathname } from 'next/navigation'

export default function Footer() {
  const pathname = usePathname()
  const year = new Date().getFullYear()

  return (
    <footer className="mt-12 py-8 text-sm transition-colors duration-300 border-t border-gray-200 dark:border-white text-gray-600 dark:text-white">
      <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <span className="font-medium">© {year} Ramos</span>
          {/* Footer Navigation - Removed as per user request */}
        </div>
        <span>All rights reserved.</span>
      </div>
    </footer>
  )
}

