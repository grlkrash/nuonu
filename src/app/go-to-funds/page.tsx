'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function GoToFundsPage() {
  const router = useRouter()
  
  useEffect(() => {
    router.push('/funds')
  }, [router])
  
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-4">Redirecting to Funds...</h1>
      <p>If you're not redirected automatically, <Link href="/funds" className="text-primary hover:underline">click here</Link>.</p>
    </div>
  )
} 