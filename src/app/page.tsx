'use client'

import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-16 text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-6">
          AI-Powered Artist Grant Agent
        </h1>
        <p className="text-xl md:text-2xl max-w-3xl mb-12">
          Discover grants, jobs, and creative opportunities tailored to your artistic profile. 
          Our AI agent automates applications and fund distribution for web3 opportunities.
        </p>
        <Link href="/onboarding">
          <Button className="bg-white text-black hover:bg-gray-200 rounded-full px-8 py-6 text-lg">
            Start Questionnaire
          </Button>
        </Link>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-800 p-8 rounded-lg">
              <h3 className="text-xl font-bold mb-4">AI-Powered Matching</h3>
              <p>Our AI analyzes your profile and matches you with the most relevant opportunities based on your skills, experience, and interests.</p>
            </div>
            <div className="bg-gray-800 p-8 rounded-lg">
              <h3 className="text-xl font-bold mb-4">Automated Applications</h3>
              <p>Let our AI agent handle the application process for web3 grants, DAO proposals, and bounties, saving you time and effort.</p>
            </div>
            <div className="bg-gray-800 p-8 rounded-lg">
              <h3 className="text-xl font-bold mb-4">Fund Distribution</h3>
              <p>Receive grant funds directly through secure blockchain transactions on Base, zkSync, and Flow networks.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
} 