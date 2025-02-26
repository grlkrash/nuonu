'use client'

import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t border-gray-800 py-6 md:py-8">
      <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
        <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-6 md:px-0">
          <p className="text-center text-sm leading-loose text-gray-400 md:text-left">
            &copy; {new Date().getFullYear()} Nuonu. All rights reserved.
          </p>
        </div>
        <div className="flex gap-4">
          <Link 
            href="/about" 
            className="text-sm text-gray-400 hover:text-white"
          >
            About
          </Link>
          <Link 
            href="/privacy" 
            className="text-sm text-gray-400 hover:text-white"
          >
            Privacy
          </Link>
          <Link 
            href="/terms" 
            className="text-sm text-gray-400 hover:text-white"
          >
            Terms
          </Link>
        </div>
      </div>
    </footer>
  )
} 