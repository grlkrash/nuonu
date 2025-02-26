import React from 'react'

interface ProgressBarProps {
  current: number
  total: number
}

export function ProgressBar({ current, total }: ProgressBarProps) {
  const progress = ((current - 1) / total) * 100

  return (
    <div className="w-full h-4 bg-gray-900 border-b border-gray-800">
      <div 
        className="h-full relative overflow-hidden"
        style={{ width: `${progress}%` }}
      >
        <div className="absolute inset-0 bg-white"></div>
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: "linear-gradient(135deg, rgba(0, 0, 0, 0.3) 25%, transparent 25%, transparent 50%, rgba(0, 0, 0, 0.3) 50%, rgba(0, 0, 0, 0.3) 75%, transparent 75%, transparent)",
            backgroundSize: "16px 16px",
            animation: "progress-bar-stripes 1s linear infinite",
          }}
        />
      </div>
      <style jsx>{`
        @keyframes progress-bar-stripes {
          from { background-position: 16px 0; }
          to { background-position: 0 0; }
        }
      `}</style>
    </div>
  )
} 