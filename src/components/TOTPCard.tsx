import { useState, useRef } from 'react'
import type { Account } from '../types'
import { useTotp } from '../hooks/useTotp'
import { CountdownRing } from './CountdownRing'

interface Props {
  account: Account
  codesVisible: boolean
  clockOffset: number
  onDelete: (id: string) => void
  onEdit: (id: string) => void
  isDragging: boolean
  isDragOver: boolean
  onDragStart: () => void
  onDragOver: () => void
  onDrop: () => void
  onDragEnd: () => void
  dragEnabled: boolean
}

const SWIPE_THRESHOLD = 72

function TrashIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
    </svg>
  )
}

function TrashIconLarge() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
    </svg>
  )
}

function PencilIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

function CopyIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function GripIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="9" cy="6" r="1.5" /><circle cx="15" cy="6" r="1.5" />
      <circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" />
      <circle cx="9" cy="18" r="1.5" /><circle cx="15" cy="18" r="1.5" />
    </svg>
  )
}

export function TOTPCard({
  account, codesVisible, clockOffset,
  onDelete, onEdit,
  isDragging, isDragOver,
  onDragStart, onDragOver, onDrop, onDragEnd,
  dragEnabled,
}: Props) {
  const { code, nextCode, secondsLeft, progress } = useTotp(account.secret, clockOffset)
  const [copied, setCopied] = useState(false)
  const [swipeX, setSwipeX] = useState(0)
  const [swiping, setSwiping] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const isScrolling = useRef<boolean | null>(null)

  const formattedCode = code.slice(0, 3) + ' ' + code.slice(3)
  const isLow   = secondsLeft <= 5
  const isAmber = secondsLeft <= 10 && secondsLeft > 5
  const codeColor = isLow ? '#f87171' : isAmber ? '#f59e0b' : account.color

  const copyCode = async () => {
    if (revealed) {
      setRevealed(false)
      setSwipeX(0)
      return
    }
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
    setTimeout(() => { navigator.clipboard.writeText('').catch(() => {}) }, 30_000)
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
    <div
      className="group relative overflow-hidden rounded-2xl card-lift"
      draggable={dragEnabled}
      onDragStart={dragEnabled ? (e) => { e.dataTransfer.effectAllowed = 'move'; onDragStart() } : undefined}
      onDragOver={dragEnabled ? (e) => { e.preventDefault(); onDragOver() } : undefined}
      onDrop={dragEnabled ? (e) => { e.preventDefault(); onDrop() } : undefined}
      onDragEnd={dragEnabled ? onDragEnd : undefined}
      style={{ opacity: isDragging ? 0.4 : 1, transition: 'opacity 0.15s' }}
    >
      {/* ── Mobile swipe-to-delete panel ── */}
      <div
        className="sm:hidden absolute inset-y-0 right-0 flex flex-col items-center justify-center gap-1"
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
          <TrashIconLarge />
          <span className="text-xs font-medium">Delete</span>
        </button>
      </div>

      {/* ── Drag grip — desktop hover ── */}
      {dragEnabled && (
        <div
          className="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 z-10 items-center justify-center w-5 opacity-0 group-hover:opacity-25 transition-opacity cursor-grab active:cursor-grabbing pointer-events-none"
          style={{ color: 'rgba(241,245,249,0.8)' }}
        >
          <GripIcon />
        </div>
      )}

      {/* ── Glass card ── */}
      <div
        className="glass-card relative cursor-pointer select-none overflow-hidden"
        style={{
          borderRadius: 16,
          padding: '22px 24px 20px',
          transform: `translateX(${swipeX}px)`,
          transition: swiping ? 'none' : 'transform 0.25s ease',
          // Glassmorphism base + per-account color wash
          background: `linear-gradient(145deg, ${account.color}14 0%, rgba(15,23,42,0.6) 55%)`,
          outline: isDragOver ? `2px solid rgba(0,194,255,0.5)` : '2px solid transparent',
          outlineOffset: '-2px',
        }}
        onClick={copyCode}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Thin color accent — left edge */}
        <div
          className="absolute left-0 top-5 bottom-5 w-[2px] rounded-full"
          style={{ background: account.color, opacity: 0.75 }}
        />

        {/* ── Top row: identity + ring ── */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3 min-w-0">
            {/* Avatar */}
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0"
              style={{
                background: `${account.color}1a`,
                border: `1px solid ${account.color}40`,
                color: account.color,
                boxShadow: `0 0 16px ${account.color}25`,
              }}
            >
              {account.issuer.charAt(0).toUpperCase()}
            </div>
            {/* Labels */}
            <div className="min-w-0">
              <p
                className="text-xs font-bold uppercase tracking-widest leading-tight truncate"
                style={{ color: account.color }}
              >
                {account.issuer}
              </p>
              <p
                className="text-xs mt-0.5 truncate"
                style={{ color: 'rgba(241,245,249,0.38)' }}
              >
                {account.name}
              </p>
            </div>
          </div>

          {/* Countdown ring — larger for premium feel */}
          <div className="flex-shrink-0 ml-3">
            <CountdownRing progress={progress} secondsLeft={secondsLeft} color={account.color} size={60} />
          </div>
        </div>

        {/* ── Code display ── */}
        <div className="mb-4">
          <p
            style={{
              color: codesVisible ? codeColor : 'rgba(241,245,249,0.15)',
              fontSize: '2.75rem',
              fontWeight: 900,
              letterSpacing: '0.13em',
              lineHeight: 1,
              fontVariantNumeric: 'tabular-nums',
              textShadow: codesVisible
                ? isLow
                  ? '0 0 32px rgba(248,113,113,0.55)'
                  : `0 0 32px ${account.color}55`
                : 'none',
              transition: 'color 0.4s ease, text-shadow 0.4s ease',
            }}
          >
            {codesVisible ? formattedCode : '••• •••'}
          </p>

          {/* Next code — visible when countdown is low */}
          {isLow && codesVisible && (
            <p
              className="mt-2 text-xs font-semibold"
              style={{
                color: 'rgba(241,245,249,0.28)',
                letterSpacing: '0.09em',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              next&nbsp;&nbsp;{nextCode.slice(0, 3)}&nbsp;{nextCode.slice(3)}
            </p>
          )}
        </div>

        {/* ── Bottom row: actions ── */}
        <div className="flex items-center justify-end gap-1.5">

          {/* Edit — desktop: hover-only; mobile: always */}
          <button
            className="sm:opacity-0 sm:group-hover:opacity-100 flex items-center justify-center w-7 h-7 rounded-lg transition-all active:scale-90"
            style={{
              background: 'rgba(99,102,241,0.1)',
              border: '1px solid rgba(99,102,241,0.22)',
              color: '#818cf8',
            }}
            onClick={e => { e.stopPropagation(); onEdit(account.id) }}
            title="Edit account"
          >
            <PencilIcon />
          </button>

          {/* Delete */}
          <button
            className="flex items-center justify-center w-7 h-7 rounded-lg transition-all active:scale-90"
            style={{
              background: 'rgba(220,38,38,0.08)',
              border: '1px solid rgba(220,38,38,0.18)',
              color: '#f87171',
              opacity: 0.35,
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '0.35')}
            onClick={e => { e.stopPropagation(); onDelete(account.id) }}
            title="Delete account"
          >
            <TrashIcon />
          </button>

          {/* Divider */}
          <div className="w-px h-4 mx-0.5 flex-shrink-0" style={{ background: 'rgba(255,255,255,0.1)' }} />

          {/* Copy */}
          <button
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all active:scale-95"
            style={copied ? {
              background: 'rgba(16,185,129,0.12)',
              color: '#34d399',
              border: '1px solid rgba(16,185,129,0.25)',
            } : {
              background: 'rgba(255,255,255,0.06)',
              color: 'rgba(241,245,249,0.45)',
              border: '1px solid rgba(255,255,255,0.09)',
            }}
            onClick={e => { e.stopPropagation(); copyCode() }}
          >
            {copied ? <CheckIcon /> : <CopyIcon />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>
    </div>
  )
}
