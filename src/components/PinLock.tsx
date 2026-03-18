import { useState, useEffect } from 'react'

interface Props {
  mode: 'set' | 'verify'
  onSuccess: (pin: string) => void
  onCancel?: () => void
  error?: string
}

const KEYS = ['1','2','3','4','5','6','7','8','9','','0','⌫']

function ShieldLockIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <rect x="9" y="11" width="6" height="5" rx="1" />
      <path d="M10 11V9a2 2 0 014 0v2" />
    </svg>
  )
}

export function PinLock({ mode, onSuccess, onCancel, error: externalError }: Props) {
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [stage, setStage] = useState<'enter' | 'confirm'>(mode === 'set' ? 'enter' : 'enter')
  const [shake, setShake] = useState(false)
  const [internalError, setInternalError] = useState('')

  const displayError = externalError || internalError
  const currentPin = stage === 'confirm' ? confirmPin : pin
  const setCurrentPin = stage === 'confirm' ? setConfirmPin : setPin

  useEffect(() => {
    if (currentPin.length === 4) {
      if (mode === 'set') {
        if (stage === 'enter') {
          setStage('confirm')
        } else {
          if (confirmPin === pin) {
            onSuccess(pin)
          } else {
            setInternalError("PINs don't match. Try again.")
            setShake(true)
            setTimeout(() => {
              setShake(false)
              setPin('')
              setConfirmPin('')
              setStage('enter')
              setInternalError('')
            }, 600)
          }
        }
      } else {
        onSuccess(pin)
      }
    }
  }, [pin, confirmPin])

  useEffect(() => {
    if (externalError) {
      setShake(true)
      setTimeout(() => {
        setShake(false)
        setPin('')
      }, 600)
    }
  }, [externalError])

  const handleKey = (key: string) => {
    if (key === '⌫') {
      setCurrentPin(p => p.slice(0, -1))
    } else if (key === '') {
      // placeholder
    } else if (currentPin.length < 4) {
      setCurrentPin(p => p + key)
    }
  }

  const title = mode === 'verify'
    ? 'Enter PIN'
    : stage === 'enter' ? 'Create PIN' : 'Confirm PIN'

  const subtitle = mode === 'verify'
    ? 'Enter your PIN to unlock'
    : stage === 'enter' ? 'Choose a 4-digit PIN' : 'Re-enter your PIN'

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center z-50 overflow-hidden"
      style={{ background: '#f8f6ff' }}
    >
      {/* Aurora orbs */}
      <div className="aurora-orb aurora-1" />
      <div className="aurora-orb aurora-2" />
      <div className="aurora-orb aurora-3" />

      <div className="relative z-10 flex flex-col items-center w-full px-8">
        {/* Icon */}
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center mb-8"
          style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))',
            border: '1px solid rgba(139,92,246,0.3)',
            boxShadow: '0 8px 32px rgba(99,102,241,0.25)',
            color: '#a78bfa',
          }}
        >
          <ShieldLockIcon />
        </div>

        <h1 className="font-bold text-2xl" style={{ color: '#1e1b4b' }}>{title}</h1>
        <p className="text-sm mt-1 mb-10" style={{ color: 'rgba(30,27,75,0.45)' }}>{subtitle}</p>

        {/* PIN dots */}
        <div
          className="flex gap-4 mb-4"
          style={{ animation: shake ? 'shake 0.4s ease' : 'none' }}
        >
          {[0, 1, 2, 3].map(i => (
            <div
              key={i}
              className="w-4 h-4 rounded-full transition-all duration-150"
              style={currentPin.length > i ? {
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                transform: 'scale(1.2)',
                boxShadow: '0 0 12px rgba(139,92,246,0.6)',
              } : {
                background: 'rgba(139,92,246,0.12)',
                transform: 'scale(1)',
              }}
            />
          ))}
        </div>

        {/* Error */}
        <div className="h-5 mb-6">
          {displayError && (
            <p className="text-red-400 text-xs text-center">{displayError}</p>
          )}
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3 w-64">
          {KEYS.map((key, i) => (
            <button
              key={i}
              onClick={() => key !== '' && handleKey(key)}
              disabled={key === ''}
              className="h-16 rounded-2xl font-semibold text-xl flex items-center justify-center transition-all active:scale-90"
              style={key === '' ? {
                background: 'transparent',
                cursor: 'default',
              } : {
                background: 'rgba(255,255,255,0.82)',
                border: '1px solid rgba(139,92,246,0.15)',
                color: key === '⌫' ? 'rgba(30,27,75,0.45)' : '#1e1b4b',
                boxShadow: '0 2px 8px rgba(139,92,246,0.08)',
                cursor: 'pointer',
              }}
            >
              {key}
            </button>
          ))}
        </div>

        {onCancel && (
          <button
            onClick={onCancel}
            className="mt-8 text-sm transition-colors"
            style={{ color: 'rgba(30,27,75,0.35)' }}
          >
            Cancel
          </button>
        )}
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-8px); }
          80% { transform: translateX(4px); }
        }
      `}</style>
    </div>
  )
}
