import { redirect } from 'next/navigation'

export default function HomePage() {
  redirect('/onboarding')
  return null
} 