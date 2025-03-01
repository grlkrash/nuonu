import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { siteConfig } from "@/config/site"
import { cn } from "@/lib/utils"
import { useLockBody } from "@/hooks/use-lock-body"
import { Icons } from "@/components/icons"

interface MobileNavProps {
  items: { title: string; href: string; disabled?: boolean }[]
  children?: React.ReactNode
}

export function MobileNav({ items, children }: MobileNavProps) {
  useLockBody()
  const pathname = usePathname()

  return (
    <div
      className={cn(
        "fixed inset-0 top-16 z-50 grid h-[calc(100vh-4rem)] grid-flow-row auto-rows-max overflow-auto p-6 pb-32 shadow-md animate-in slide-in-from-bottom-80 md:hidden"
      )}
    >
      <div className="relative z-20 grid gap-6 rounded-md bg-popover p-4 text-popover-foreground shadow-md">
        <Link href="/" className="flex items-center space-x-2">
          <Icons.logo />
          <span className="font-bold">{siteConfig.name}</span>
        </Link>
        <nav className="grid grid-flow-row auto-rows-max text-sm">
          <Link
            href="/dashboard"
            className={cn(
              "flex w-full items-center rounded-md p-2 text-sm font-medium hover:underline",
              pathname === "/dashboard" ? "text-foreground" : "text-foreground/60"
            )}
          >
            Dashboard
          </Link>
          <Link
            href="/funds"
            className={cn(
              "flex w-full items-center rounded-md p-2 text-sm font-medium hover:underline",
              pathname === "/funds" ? "text-foreground" : "text-foreground/60"
            )}
          >
            Funds & Wallet
          </Link>
          <Link
            href="/docs"
            className={cn(
              "flex w-full items-center rounded-md p-2 text-sm font-medium hover:underline",
              pathname === "/docs" ? "text-foreground" : "text-foreground/60"
            )}
          >
            Documentation
          </Link>
          <Link
            href={siteConfig.links.github}
            className={cn(
              "flex w-full items-center rounded-md p-2 text-sm font-medium hover:underline",
              pathname === siteConfig.links.github
                ? "text-foreground"
                : "text-foreground/60"
            )}
          >
            GitHub
          </Link>
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.disabled ? "#" : item.href}
              className={cn(
                "flex w-full items-center rounded-md p-2 text-sm font-medium hover:underline",
                item.disabled && "cursor-not-allowed opacity-60",
                pathname === item.href ? "text-foreground" : "text-foreground/60"
              )}
            >
              {item.title}
            </Link>
          ))}
        </nav>
        {children}
      </div>
    </div>
  )
} 