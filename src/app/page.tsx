"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import Questionnaire from "@/components/onboarding/questionnaire"
import { LandingHeader } from "@/components/layout/landing-header"
import { Button } from "@/components/ui/button"

export default function Home() {
  const [scrolled, setScrolled] = useState(false)
  const [logoScale, setLogoScale] = useState(1)
  const homeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => {
      if (homeRef.current) {
        const scrollPosition = window.scrollY
        const triggerPosition = homeRef.current.offsetHeight * 0.3 // 30% of the home section height
        setScrolled(scrollPosition > triggerPosition)

        // Calculate logo scale based on scroll position
        const maxScroll = homeRef.current.offsetHeight - window.innerHeight
        const scale = Math.max(0.5, 1 - scrollPosition / maxScroll)
        setLogoScale(scale)
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <main className="min-h-screen bg-black text-white">
      <LandingHeader />
      <div ref={homeRef} className="h-screen flex flex-col items-center justify-center relative">
        <div className="flex flex-col items-center justify-center">
          <div style={{ transform: `scale(${logoScale})`, transition: "transform 0.3s ease-out" }}>
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/nuonu%20logomark-sYgJYMazAtVYSiirs625uXJ2QFnzqE.png"
              alt="nuonu logo"
              width={400}
              height={100}
              priority
            />
          </div>
          <p className="mt-4 text-center text-lg">AI-powered matchmaking: connecting creators with funds</p>
        </div>
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-4xl">↓</div>
      </div>
      <div className="min-h-screen">
        <div id="progress-bar-container" className="w-full fixed top-0 left-0 right-0 z-10"></div>
        <Questionnaire />
      </div>
    </main>
  )
} 