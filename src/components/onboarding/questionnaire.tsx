"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from "next/navigation"
import { createPortal } from "react-dom"
import { supabase } from "@/lib/supabase/client"

const questions = [
  { id: 1, text: "What is your name?", type: "input" },
  { id: 2, text: "What's your email?", type: "input" },
  { id: 3, text: "How old are you?", type: "input" },
  { id: 4, text: "Where are you from?", type: "input" },
  { id: 5, text: "What field do you work in?", type: "input" },
  { id: 6, text: "What are your relevant skills and experience?", type: "textarea" },
  {
    id: 7,
    text: "Share as much information about yourself as you can. (If you have old artist bios, you can paste them here)",
    type: "textarea",
  },
  { id: 8, text: "Share a resume or CV if available.", type: "file", optional: true },
]

export default function Questionnaire() {
  const router = useRouter()
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string | File>>({})
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [textareaHeight, setTextareaHeight] = useState("24px")
  const [showSignUpPrompt, setShowSignUpPrompt] = useState(false)
  const [mountedState, setMountedState] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const currentQuestionData = questions[currentQuestion]

  const handleInputChange = (value: string) => {
    setAnswers({ ...answers, [currentQuestion + 1]: value })
    if (currentQuestionData.type === "textarea") {
      adjustTextareaHeight()
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type === "application/pdf") {
      setAnswers({ ...answers, [currentQuestion + 1]: file })
    } else if (file) {
      alert("Please upload a PDF file.")
    }
  }

  const adjustTextareaHeight = useCallback(() => {
    if (inputRef.current && inputRef.current instanceof HTMLTextAreaElement) {
      inputRef.current.style.height = "24px"
      inputRef.current.style.height = `${Math.max(24, inputRef.current.scrollHeight)}px`
      setTextareaHeight(`${Math.max(24, inputRef.current.scrollHeight)}px`)
    }
  }, [])

  const goToNextQuestion = () => {
    if (
      currentQuestion < questions.length - 1 &&
      (answers[currentQuestion + 1] || currentQuestionData.optional)
    ) {
      setCurrentQuestion(currentQuestion + 1)
      setTextareaHeight("24px")
    }
  }

  const goToPreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
      setTextareaHeight("24px")
    }
  }

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && !event.shiftKey && answers[currentQuestion + 1]) {
      event.preventDefault()
      goToNextQuestion()
    }
  }

  useEffect(() => {
    setMountedState(true)
    if (inputRef.current) {
      inputRef.current.focus()
      if (currentQuestionData.type === "textarea") {
        adjustTextareaHeight()
      }
    }
  }, [adjustTextareaHeight, currentQuestionData.type, currentQuestion])

  const isLastQuestion = currentQuestion === questions.length - 1

  const renderProgressBar = () => {
    const progress = (currentQuestion / (questions.length - 1)) * 100

    return (
      <div className="w-full h-2 bg-gray-800">
        <div className="h-full bg-white" style={{ width: `${progress}%` }} />
      </div>
    )
  }

  const handleFinish = async () => {
    setIsSubmitting(true)
    try {
      // Save answers to the database
      const profileData = {
        name: answers[1] as string,
        email: answers[2] as string,
        age: answers[3] as string,
        location: answers[4] as string,
        field: answers[5] as string,
        skills: answers[6] as string,
        bio: answers[7] as string,
        // Handle file upload separately if needed
      }
      
      // Check if user exists with this email
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', profileData.email)
        .single()
      
      if (existingUser) {
        // Update existing profile
        await supabase
          .from('profiles')
          .update(profileData)
          .eq('id', existingUser.id)
      } else {
        // Create new profile
        await supabase
          .from('profiles')
          .insert([profileData])
      }
      
      // Show sign up prompt
      setShowSignUpPrompt(true)
    } catch (error) {
      console.error("Error saving profile:", error)
      alert("There was an error saving your information. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSignUpOption = async (option: string) => {
    if (option === "signup") {
      // Store email in local storage for sign-up process
      if (typeof window !== "undefined" && answers[2]) {
        localStorage.setItem("onboardingEmail", answers[2] as string)
      }
      
      // Redirect to sign-up page
      router.push("/signup")
    } else if (option === "signin") {
      // Store email in local storage for sign-in process
      if (typeof window !== "undefined" && answers[2]) {
        localStorage.setItem("onboardingEmail", answers[2] as string)
      }
      
      // Redirect to sign-in page
      router.push("/signin")
    } else {
      // Skip sign up and go directly to dashboard
      // For unauthenticated users, we'll show a limited dashboard view
      router.push("/dashboard")
    }
  }

  return (
    <>
      {mountedState && createPortal(renderProgressBar(), document.getElementById("progress-bar-container")!)}
      <div className="flex flex-col items-center justify-between min-h-screen p-4">
        <div className="flex-1 flex items-center justify-center w-full max-w-3xl">
          <div className="flex flex-col items-center justify-center space-y-1 w-auto">
            <span className="text-2xl font-bold text-white text-center w-full mb-2">{currentQuestionData.text}</span>
            {currentQuestionData.type === "input" && (
              <Input
                type="text"
                value={(answers[currentQuestion + 1] as string) || ""}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyPress={handleKeyPress}
                ref={inputRef as React.RefObject<HTMLInputElement>}
                className="bg-white text-black border-none outline-none p-2 rounded-full caret-black"
                style={{ width: "100%", maxWidth: "600px" }}
              />
            )}
            {currentQuestionData.type === "textarea" && (
              <Textarea
                value={(answers[currentQuestion + 1] as string) || ""}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyPress={handleKeyPress}
                ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                className="bg-white text-black border-none outline-none p-2 resize-none rounded-3xl caret-black"
                style={{ width: "100%", maxWidth: "600px", height: textareaHeight }}
                rows={1}
              />
            )}
            {currentQuestionData.type === "file" && (
              <div className="flex flex-col items-center">
                <input type="file" accept=".pdf" onChange={handleFileChange} ref={fileInputRef} className="hidden" />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-white text-black hover:bg-gray-200 rounded-full px-4 py-2 mb-2"
                >
                  Upload PDF
                </Button>
                {answers[currentQuestion + 1] instanceof File && (
                  <span className="text-white">File uploaded: {(answers[currentQuestion + 1] as File).name}</span>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="w-full max-w-md mx-auto flex justify-between px-4 pb-8">
          <Button
            onClick={goToPreviousQuestion}
            disabled={currentQuestion === 0}
            className="bg-transparent text-white border border-white hover:bg-white hover:text-black rounded-xl px-4 py-2"
          >
            Back
          </Button>
          <Button
            onClick={isLastQuestion ? handleFinish : goToNextQuestion}
            disabled={(isLastQuestion && isSubmitting) || (!isLastQuestion && !answers[currentQuestion + 1] && !currentQuestionData.optional)}
            className="bg-transparent text-white border border-white hover:bg-white hover:text-black rounded-xl px-4 py-2"
          >
            {isLastQuestion ? (isSubmitting ? "Saving..." : "Finish") : "Next"}
          </Button>
        </div>
      </div>

      {showSignUpPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-black border border-white p-4 rounded-xl max-w-xs w-full">
            <h2 className="text-xl font-bold text-white text-center mb-2">sign up for a free account?</h2>
            <p className="text-xs text-white text-left mb-3">
              signing up will allow you to keep track of your grant matches, receive status updates, and automatically
              apply for matches using your unique information
            </p>
            <div className="flex flex-col items-center">
              <div className="flex gap-2 w-full mb-2">
                <Button
                  onClick={() => handleSignUpOption("signup")}
                  className="bg-transparent text-white border border-white hover:bg-white hover:text-black rounded-xl px-2 py-1 text-xs flex-1"
                >
                  Sign Up
                </Button>
                <Button
                  onClick={() => handleSignUpOption("signin")}
                  className="bg-transparent text-white border border-white hover:bg-white hover:text-black rounded-xl px-2 py-1 text-xs flex-1"
                >
                  Sign In
                </Button>
              </div>
              <Button
                onClick={() => handleSignUpOption("skip")}
                className="bg-transparent text-white border border-white hover:bg-white hover:text-black rounded-xl px-2 py-1 text-xs w-full"
              >
                Skip
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
} 