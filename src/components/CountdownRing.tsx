interface Props {
  progress: number
  secondsLeft: number
  color: string
  size?: number
}

export function CountdownRing({ progress, secondsLeft, color, size = 44 }: Props) {
  const radius = (size - 6) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference * (1 - progress)
  const isLow    = secondsLeft <= 5
  const isAmber  = secondsLeft <= 10 && secondsLeft > 5
  const strokeColor = isLow ? '#f87171' : isAmber ? '#f59e0b' : color
  const labelColor  = isLow ? '#f87171' : isAmber ? '#f59e0b' : 'rgba(241,245,249,0.45)'

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="-rotate-90"
        style={isLow
          ? { animation: 'pulse-ring-red 1s ease-in-out infinite' }
          : { filter: `drop-shadow(0 0 6px ${strokeColor}90)` }
        }
      >
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth={3}
        />
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.5s ease' }}
        />
      </svg>
      <span
        className="absolute font-bold tabular-nums"
        style={{ color: labelColor, fontSize: 11, transition: 'color 0.5s ease' }}
      >
        {secondsLeft}
      </span>
    </div>
  )
}
