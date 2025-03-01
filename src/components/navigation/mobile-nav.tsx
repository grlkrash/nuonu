'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavItem {
  title: string
  href: string
}

interface MobileNavProps {
  items: NavItem[]
  onClose?: () => void
}

export function MobileNav({ items, onClose }: MobileNavProps) {
  const pathname = usePathname()
  const segment = pathname?.split('/')[1]
  
  return (
    <div className="fixed inset-0 top-16 z-50 grid h-[calc(100vh-4rem)] grid-flow-row auto-rows-max overflow-auto p-6 pb-32 shadow-md animate-in slide-in-from-bottom-80 md:hidden">
      <div className="relative z-20 rounded-md bg-background p-4">
        <nav className="grid grid-flow-row auto-rows-max text-sm">
          {items.map((item, index) => (
            <Link
              key={index}
              href={item.href}
              className={`flex w-full items-center rounded-md p-2 text-sm font-medium ${
                item.href.startsWith(`/${segment}`) 
                  ? 'bg-accent' 
                  : 'hover:bg-accent'
              }`}
              onClick={onClose}
            >
              {item.title}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  )
} 