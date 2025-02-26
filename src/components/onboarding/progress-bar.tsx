interface ProgressBarProps {
  current: number
  total: number
}

export function ProgressBar({ current, total }: ProgressBarProps) {
  const progress = ((current - 1) / total) * 100

  return (
    <div className="w-full h-4 bg-gray-800 border border-white">
      <div className="h-full bg-white" style={{ width: `${progress}%` }}>
        <div
          className="w-full h-full"
          style={{
            backgroundImage: "linear-gradient(90deg, #ffffff 50%, #cccccc 50%)",
            backgroundSize: "8px 8px",
          }}
        />
      </div>
    </div>
  )
} 