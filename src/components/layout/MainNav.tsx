"use client"
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'

export default function MainNav() {
  const pathname = usePathname()
  // [STICKY NOTE] ACTIVE STATE LOGIC
  // Menentukan menu mana yang sedang aktif (berwarna putih/terang).
  // - Works: Aktif di halaman depan (/) dan /works.
  // - About: Aktif di /about.
  // - Contact: Aktif di /contact.
  const isWorks = pathname?.startsWith('/works') || pathname === '/'
  const isAbout = pathname?.startsWith('/about')
  const isContact = pathname?.startsWith('/contact')
  return (
    <div className="rounded-full bg-black/[.04] border border-gray-200 px-1.5 py-1.5 backdrop-blur supports-[backdrop-filter]:bg-black/[.04] transition-colors duration-300">
      <nav className="flex items-center gap-2">
        <Link
          href="/works"
          className={clsx(
            'px-4 md:px-5 py-2 md:py-2.5 text-sm md:text-base rounded-full transition text-gray-900',
            isWorks ? 'bg-white' : 'hover:bg-white/60'
          )}
        >
          Karya
        </Link>
        <Link
          href="/about"
          className={clsx(
            'px-4 md:px-5 py-2 md:py-2.5 text-sm md:text-base rounded-full transition text-gray-900',
            isAbout ? 'bg-white' : 'hover:bg-white/60'
          )}
        >
          Tentang
        </Link>
        <Link
          href="/contact"
          className={clsx(
            'px-4 md:px-5 py-2 md:py-2.5 text-sm md:text-base rounded-full transition text-gray-900',
            isContact ? 'bg-white' : 'hover:bg-white/60'
          )}
        >
          Kontak
        </Link>
      </nav>
    </div>
  )
}
