'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ProgressBar } from './progress-bar'
import Link from 'next/link'

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

export function Questionnaire() {
  const router = useRouter()
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string | File>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [textareaHeight, setTextareaHeight] = useState("24px")

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
    if (inputRef.current) {
      inputRef.current.focus()
      if (currentQuestionData.type === "textarea") {
        adjustTextareaHeight()
      }
    }
  }, [adjustTextareaHeight, currentQuestionData.type, currentQuestion])

  const isLastQuestion = currentQuestion === questions.length - 1

  const handleFinish = async () => {
    try {
      setIsSubmitting(true)
      console.log("Questionnaire completed", answers)
      
      // Here you would typically submit the answers to your backend
      // For example:
      // const response = await fetch('/api/onboarding', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(answers)
      // });
      
      // For now, we'll just simulate a delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Show the account creation prompt instead of redirecting
      setIsCompleted(true)
    } catch (error) {
      console.error("Error submitting questionnaire:", error)
      alert("There was an error submitting your information. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isCompleted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-black text-white">
        <div className="max-w-md w-full bg-gray-900 p-8 rounded-lg shadow-lg border border-gray-800">
          <h2 className="text-2xl font-bold mb-6 text-center">Create Your Account</h2>
          <p className="mb-6 text-gray-300">
            Thanks for completing the questionnaire! Create an account to see your personalized grant matches and start applying.
          </p>
          <div className="space-y-4">
            <Link
              href={`/signup?email=${encodeURIComponent(answers[2] as string || '')}`}
              className="block w-full px-6 py-3 bg-white hover:bg-gray-200 text-black font-medium rounded-md transition-colors text-center"
            >
              Create Account
            </Link>
            <Link
              href="/signin"
              className="block w-full px-6 py-3 bg-transparent hover:bg-gray-800 text-white font-medium rounded-md transition-colors text-center border border-white"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-between min-h-screen p-4 pt-16 bg-black text-white">
      <div className="w-full fixed top-0 left-0 right-0 z-10">
        <ProgressBar current={currentQuestion + 1} total={questions.length} />
      </div>
      <div className="flex-1 flex items-center justify-center w-full max-w-3xl">
        <div className="flex flex-col items-center justify-center space-y-1 w-auto">
          <span className="text-2xl font-bold text-white text-center w-full mb-2">{currentQuestionData.text}</span>
          {currentQuestionData.type === "input" && (
            <Input
              type="text"
              value={(answers[currentQuestion + 1] as string) || ""}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyPress}
              ref={inputRef as React.RefObject<HTMLInputElement>}
              className="bg-white text-black border-none outline-none p-2 rounded-full caret-black"
              style={{ width: "100%", maxWidth: "600px" }}
            />
          )}
          {currentQuestionData.type === "textarea" && (
            <Textarea
              value={(answers[currentQuestion + 1] as string) || ""}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyPress}
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
          {isLastQuestion 
            ? (isSubmitting ? "Submitting..." : "Finish") 
            : "Next"}
        </Button>
      </div>
    </div>
  )
} 