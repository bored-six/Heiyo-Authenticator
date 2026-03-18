import { useState, useRef } from 'react'
import type { Account } from '../types'
import { useTotp } from '../hooks/useTotp'
import { CountdownRing } from './CountdownRing'

interface Props {
  account: Account
  onDelete: (id: string) => void
}

const SWIPE_THRESHOLD = 72

function TrashIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
    </svg>
  )
}

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

export function TOTPCard({ account, onDelete }: Props) {
  const { code, secondsLeft, progress } = useTotp(account.secret)
  const [copied, setCopied] = useState(false)
  const [swipeX, setSwipeX] = useState(0)
  const [swiping, setSwiping] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const isScrolling = useRef<boolean | null>(null)

  const formattedCode = code.slice(0, 3) + ' ' + code.slice(3)
  const isLow = secondsLeft <= 5
  const codeColor = isLow ? '#f87171' : account.color

  const copyCode = async () => {
    if (revealed) {
      setRevealed(false)
      setSwipeX(0)
      return
    }
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
    isScrolling.current = null
    setSwiping(true)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - touchStartX.current
    const dy = e.touches[0].clientY - touchStartY.current

    if (isScrolling.current === null) {
      isScrolling.current = Math.abs(dy) > Math.abs(dx)
    }
    if (isScrolling.current) return

    if (revealed && dx > 0) {
      setSwipeX(Math.min(0, -SWIPE_THRESHOLD + dx))
    } else if (!revealed && dx < 0) {
      setSwipeX(Math.max(-SWIPE_THRESHOLD, dx))
    }
  }

  const onTouchEnd = () => {
    setSwiping(false)
    isScrolling.current = null
    if (!revealed && swipeX <= -SWIPE_THRESHOLD * 0.6) {
      setSwipeX(-SWIPE_THRESHOLD)
      setRevealed(true)
    } else if (revealed && swipeX > -SWIPE_THRESHOLD * 0.4) {
      setSwipeX(0)
      setRevealed(false)
    } else {
      setSwipeX(revealed ? -SWIPE_THRESHOLD : 0)
    }
  }

  return (
    <div className="relative overflow-hidden rounded-2xl">
      {/* Delete zone */}
      <div
        className="absolute inset-y-0 right-0 flex flex-col items-center justify-center gap-1"
        style={{
          background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
          width: SWIPE_THRESHOLD + 16,
          color: 'white',
        }}
      >
        <button
          className="flex flex-col items-center gap-1 transition-all active:scale-90"
          onClick={() => onDelete(account.id)}
        >
          <TrashIcon />
          <span className="text-xs font-medium">Delete</span>
        </button>
      </div>

      {/* Glass card */}
      <div
        className="glass-card relative flex items-center gap-4 p-4 cursor-pointer select-none"
        style={{
          borderRadius: 16,
          transform: `translateX(${swipeX}px)`,
          transition: swiping ? 'none' : 'transform 0.25s ease',
        }}
        onClick={copyCode}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Avatar */}
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-base flex-shrink-0"
          style={{
            background: `radial-gradient(circle at 35% 35%, ${account.color}cc, ${account.color}55)`,
            boxShadow: `0 4px 18px ${account.color}55`,
            border: `1px solid ${account.color}40`,
          }}
        >
          {account.issuer.charAt(0).toUpperCase()}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium truncate" style={{ color: account.color + 'cc' }}>
            {account.issuer}
          </p>
          <p className="text-sm truncate" style={{ color: 'rgba(30,27,75,0.6)' }}>{account.name}</p>
          <p
            className="tabular-nums tracking-widest mt-0.5 font-black"
            style={{
              color: codeColor,
              fontSize: '1.5rem',
              lineHeight: 1.2,
            }}
          >
            {formattedCode}
          </p>
        </div>

        {/* Right side */}
        <div className="flex flex-col items-center gap-2 flex-shrink-0">
          <CountdownRing progress={progress} secondsLeft={secondsLeft} color={account.color} />
          <div
            className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full transition-all"
            style={copied ? {
              background: 'rgba(16,185,129,0.12)',
              color: '#059669',
              border: '1px solid rgba(16,185,129,0.3)',
            } : {
              background: 'rgba(139,92,246,0.06)',
              color: 'rgba(30,27,75,0.4)',
              border: '1px solid rgba(139,92,246,0.12)',
            }}
          >
            {copied ? <CheckIcon /> : <CopyIcon />}
            {copied ? 'Copied' : 'Copy'}
          </div>
        </div>
      </div>
    </div>
  )
}
