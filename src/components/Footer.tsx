"use client"
import { usePathname } from 'next/navigation'

export default function Footer(){
  const pathname = usePathname()
  const year = new Date().getFullYear()
  
  return (
    <footer className="mt-12 py-8 text-sm transition-colors duration-300 border-t border-gray-200 dark:border-white text-gray-600 dark:text-white">
      <div className="container flex items-center justify-between">
        <span>© {year} Your Name</span>
        <span>All rights reserved.</span>
      </div>
    </footer>
  )
}

