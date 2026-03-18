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
  const isLow = secondsLeft <= 5
  const strokeColor = isLow ? '#f87171' : color

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="-rotate-90"
        style={{ filter: `drop-shadow(0 0 5px ${strokeColor}80)` }}
      >
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(139,92,246,0.1)"
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
          style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s ease' }}
        />
      </svg>
      <span
        className="absolute font-bold tabular-nums"
        style={{
          color: isLow ? '#ef4444' : 'rgba(30,27,75,0.55)',
          fontSize: 11,
        }}
      >
        {secondsLeft}
      </span>
    </div>
  )
}
