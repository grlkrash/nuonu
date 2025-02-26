'use client'

import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t py-6 md:py-8">
      <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
        <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-6 md:px-0">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            &copy; {new Date().getFullYear()} Artist Grant AI Agent. All rights reserved.
          </p>
        </div>
        <div className="flex gap-4">
          <Link 
            href="/about" 
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            About
          </Link>
          <Link 
            href="/privacy" 
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Privacy
          </Link>
          <Link 
            href="/terms" 
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Terms
          </Link>
        </div>
      </div>
    </footer>
  )
} 