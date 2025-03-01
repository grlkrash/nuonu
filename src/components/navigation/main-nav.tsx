'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import Image from 'next/image'
import { MobileNav } from './mobile-nav'

interface NavItem {
  title: string
  href: string
}

interface MainNavProps {
  items?: NavItem[]
}

export function MainNav({ items }: MainNavProps) {
  const pathname = usePathname()
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const segment = pathname?.split('/')[1]

  return (
    <div className="flex gap-6 md:gap-10">
      <Link href="/" className="hidden items-center space-x-2 md:flex">
        <Image
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/nuonu%20logomark-sYgJYMazAtVYSiirs625uXJ2QFnzqE.png"
          alt="nuonu logo"
          width={40}
          height={40}
          priority
        />
        <span className="hidden font-bold sm:inline-block">
          nuonu
        </span>
      </Link>
      {items?.length ? (
        <nav className="hidden gap-6 md:flex">
          {items?.map((item, index) => (
            <Link
              key={index}
              href={item.href}
              className={`flex items-center text-lg font-medium transition-colors hover:text-foreground/80 sm:text-sm ${
                item.href.startsWith(`/${segment}`)
                  ? "text-foreground"
                  : "text-foreground/60"
              }`}
            >
              {item.title}
            </Link>
          ))}
        </nav>
      ) : null}
      <button
        className="flex items-center space-x-2 md:hidden"
        onClick={() => setShowMobileMenu(!showMobileMenu)}
      >
        {showMobileMenu ? <X /> : <Menu />}
        <span className="font-bold">Menu</span>
      </button>
      {showMobileMenu && items && (
        <MobileNav items={items} onClose={() => setShowMobileMenu(false)} />
      )}
    </div>
  )
} 