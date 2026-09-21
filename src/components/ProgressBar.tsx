interface ProgressBarProps {
  percent: number
  color?: string
  className?: string
}

export function ProgressBar({ percent, color = '#3b82f6', className = '' }: ProgressBarProps) {
  return (
    <div className={`h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-800 ${className}`}>
      <div
        className="h-full rounded-full transition-all duration-300"
        style={{ width: `${percent}%`, backgroundColor: color }}
      />
    </div>
  )
}
