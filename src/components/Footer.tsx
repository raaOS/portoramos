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
          <nav className="flex gap-4 text-sm">
            <a href="/" className="hover:text-black dark:hover:text-gray-300 transition-colors">Home</a>
            <a href="/about" className="hover:text-black dark:hover:text-gray-300 transition-colors">About</a>
            <a href="/works" className="hover:text-black dark:hover:text-gray-300 transition-colors">Works</a>
            <a href="/contact" className="hover:text-black dark:hover:text-gray-300 transition-colors">Contact</a>
          </nav>
        </div>
        <span>All rights reserved.</span>
      </div>
    </footer>
  )
}

