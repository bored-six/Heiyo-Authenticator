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

function TrashIcon({ size = 13 }: { size?: number }) {
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
      className="rounded-2xl overflow-hidden"
      draggable={dragEnabled}
      onDragStart={dragEnabled ? (e) => { e.dataTransfer.effectAllowed = 'move'; onDragStart() } : undefined}
      onDragOver={dragEnabled ? (e) => { e.preventDefault(); onDragOver() } : undefined}
      onDrop={dragEnabled ? (e) => { e.preventDefault(); onDrop() } : undefined}
      onDragEnd={dragEnabled ? onDragEnd : undefined}
      style={{ opacity: isDragging ? 0.4 : 1, transition: 'opacity 0.15s' }}
    >
      {/* Mobile swipe-to-delete panel */}
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

      {/* Drag grip — absolute left, desktop hover only */}
      {dragEnabled && (
        <div
          className="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 z-10 items-center justify-center w-5 opacity-0 group-hover:opacity-25 transition-opacity cursor-grab active:cursor-grabbing pointer-events-none"
          style={{ color: 'rgba(241,245,249,0.8)' }}
        >
          <GripIcon />
        </div>
      )}

      {/* Glass slab — slides for swipe */}
      <div
        className="glass-slab group relative cursor-pointer select-none"
        style={{
          borderRadius: 16,
          padding: '20px 24px',
          transform: `translateX(${swipeX}px)`,
          transition: swiping ? 'none' : 'transform 0.25s ease',
          background: `linear-gradient(135deg, ${account.color}10 0%, rgba(15,23,42,0.55) 60%)`,
          outline: isDragOver ? '1.5px solid rgba(0,194,255,0.4)' : 'none',
        }}
        onClick={copyCode}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Horizontal flex row — the slab layout */}
        <div className="flex items-center gap-5">

          {/* LEFT: Avatar + Labels */}
          <div
            className="flex items-center gap-3 min-w-0"
            style={{ width: 168, flexShrink: 0 }}
          >
            {/* Avatar — ring style */}
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                flexShrink: 0,
                border: `2px solid ${account.color}`,
                background: `${account.color}12`,
                boxShadow: `0 0 12px ${account.color}30`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: account.color,
                fontSize: 14,
                fontWeight: 700,
              }}
            >
              {account.issuer.charAt(0).toUpperCase()}
            </div>

            {/* Labels */}
            <div style={{ minWidth: 0 }}>
              <p
                style={{
                  color: account.color,
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {account.issuer}
              </p>
              <p
                style={{
                  color: 'rgba(241,245,249,0.35)',
                  fontSize: 11,
                  marginTop: 2,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {account.name}
              </p>
            </div>
          </div>

          {/* CENTER: Code */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                color: codesVisible ? codeColor : 'rgba(241,245,249,0.12)',
                fontSize: 'clamp(1.875rem, 5vw, 3rem)',
                fontWeight: 700,
                letterSpacing: '0.12em',
                lineHeight: 1,
                fontVariantNumeric: 'tabular-nums',
                textShadow: codesVisible
                  ? isLow
                    ? '0 0 28px rgba(248,113,113,0.5)'
                    : `0 0 28px ${account.color}45`
                  : 'none',
                transition: 'color 0.4s ease',
              }}
            >
              {codesVisible ? formattedCode : '••• •••'}
            </p>

            {isLow && codesVisible && (
              <p
                style={{
                  marginTop: 6,
                  fontSize: 11,
                  color: 'rgba(241,245,249,0.28)',
                  letterSpacing: '0.08em',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                next {nextCode.slice(0, 3)} {nextCode.slice(3)}
              </p>
            )}
          </div>

          {/* RIGHT: Ring + Actions */}
          <div
            style={{
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: 10,
            }}
          >
            {/* Ring as jewel */}
            <CountdownRing
              progress={progress}
              secondsLeft={secondsLeft}
              color={account.color}
              size={52}
            />

            {/* Action row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>

              {/* Edit — desktop hover-only */}
              <button
                className="sm:opacity-0 sm:group-hover:opacity-100 transition-all active:scale-90"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(99,102,241,0.1)',
                  color: '#818cf8',
                  border: 'none',
                  cursor: 'pointer',
                }}
                onClick={e => { e.stopPropagation(); onEdit(account.id) }}
                title="Edit account"
              >
                <PencilIcon />
              </button>

              {/* Delete */}
              <button
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(220,38,38,0.08)',
                  color: '#f87171',
                  opacity: 0.3,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'opacity 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '0.3')}
                onClick={e => { e.stopPropagation(); onDelete(account.id) }}
                title="Delete account"
              >
                <TrashIcon />
              </button>

              {/* Divider */}
              <div
                style={{
                  width: 1,
                  height: 16,
                  background: 'rgba(255,255,255,0.08)',
                }}
              />

              {/* Copy button */}
              <button
                style={copied ? {
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '5px 10px',
                  borderRadius: 8,
                  fontSize: 11,
                  fontWeight: 600,
                  background: 'rgba(16,185,129,0.12)',
                  color: '#34d399',
                  border: 'none',
                  cursor: 'pointer',
                } : {
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '5px 10px',
                  borderRadius: 8,
                  fontSize: 11,
                  fontWeight: 600,
                  background: 'rgba(255,255,255,0.05)',
                  color: 'rgba(241,245,249,0.4)',
                  border: 'none',
                  cursor: 'pointer',
                }}
                onClick={e => { e.stopPropagation(); copyCode() }}
              >
                {copied ? <CheckIcon /> : <CopyIcon />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
