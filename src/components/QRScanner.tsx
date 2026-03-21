import { useEffect, useRef, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Html5Qrcode } from 'html5-qrcode'
import { motion } from 'framer-motion'

export interface ScannedAccount {
  name: string
  issuer: string
  secret: string
}

interface Props {
  onScan: (result: ScannedAccount) => void
  onClose: () => void
}

type Camera = { id: string; label: string }
type Phase = 'starting' | 'scanning' | 'denied' | 'success'

const SCANNER_ID = 'haa013-qr-scan'
const VF = 260 // viewfinder square px

// ── Audio ─────────────────────────────────────────────────────────────────────

function playPing() {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(1400, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.12)
    gain.gain.setValueAtTime(0.28, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.28)
  } catch { /* noop — AudioContext unavailable */ }
}

// ── OTPAuth parser ────────────────────────────────────────────────────────────

function parseOtpAuth(uri: string): ScannedAccount | null {
  try {
    const url = new URL(uri)
    if (url.protocol !== 'otpauth:') return null
    const label = decodeURIComponent(url.pathname.replace('//', ''))
    const parts = label.includes(':') ? label.split(':') : ['', label]
    const issuer = url.searchParams.get('issuer') || parts[0] || 'Unknown'
    const name   = parts[parts.length - 1] || label
    const secret = url.searchParams.get('secret') || ''
    if (!secret) return null
    return { name: name.trim(), issuer: issuer.trim(), secret }
  } catch {
    return null
  }
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  )
}

function SwitchCameraIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 7h-9" /><path d="M14 17H5" />
      <polyline points="17 4 20 7 17 10" /><polyline points="8 14 5 17 8 20" />
    </svg>
  )
}

function CameraBlockedIcon() {
  return (
    <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

// ── Viewfinder corners ────────────────────────────────────────────────────────

const CORNERS: React.CSSProperties[] = [
  { top: 0,    left: 0,  borderTop: '2.5px solid #00c2ff', borderLeft:  '2.5px solid #00c2ff', borderRadius: '4px 0 0 0' },
  { top: 0,    right: 0, borderTop: '2.5px solid #00c2ff', borderRight: '2.5px solid #00c2ff', borderRadius: '0 4px 0 0' },
  { bottom: 0, left: 0,  borderBottom: '2.5px solid #00c2ff', borderLeft:  '2.5px solid #00c2ff', borderRadius: '0 0 0 4px' },
  { bottom: 0, right: 0, borderBottom: '2.5px solid #00c2ff', borderRight: '2.5px solid #00c2ff', borderRadius: '0 0 4px 0' },
]

// ── Component ─────────────────────────────────────────────────────────────────

export function QRScanner({ onScan, onClose }: Props) {
  const [phase, setPhase]     = useState<Phase>('starting')
  const [cameras, setCameras] = useState<Camera[]>([])
  const [camIdx, setCamIdx]   = useState(0)
  const [badScan, setBadScan] = useState(false)
  const scannerRef            = useRef<Html5Qrcode | null>(null)
  const handledRef            = useRef(false)

  // ── Inject scoped CSS for library-injected elements ────────────────────────
  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `
      #${SCANNER_ID} { width: 100%; height: 100%; overflow: hidden; }
      #${SCANNER_ID} video { width: 100% !important; height: 100% !important; object-fit: cover; border-radius: 0; }
      #${SCANNER_ID} canvas { position: absolute !important; opacity: 0 !important; pointer-events: none !important; }
      #${SCANNER_ID} #qr-shaded-region { display: none !important; }
    `
    document.head.appendChild(style)
    return () => { document.head.removeChild(style) }
  }, [])

  // ── Camera helpers ─────────────────────────────────────────────────────────

  const doStop = useCallback(async () => {
    if (!scannerRef.current) return
    try { await scannerRef.current.stop() } catch { /* ignore */ }
    try { scannerRef.current.clear() } catch { /* ignore */ }
    scannerRef.current = null
  }, [])

  const doStart = useCallback(async (cameraId: string) => {
    scannerRef.current = new Html5Qrcode(SCANNER_ID)
    await scannerRef.current.start(
      cameraId,
      { fps: 12, disableFlip: false },
      (text) => {
        if (handledRef.current) return
        const parsed = parseOtpAuth(text)
        if (!parsed) { setBadScan(true); return }
        handledRef.current = true
        playPing()
        setPhase('success')
        doStop()
        setTimeout(() => onScan(parsed), 900)
      },
      () => { /* per-frame decode errors are normal */ }
    )
    setPhase('scanning')
  }, [doStop, onScan])

  // ── Init ───────────────────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false
    const init = async () => {
      try {
        const devices = (await Html5Qrcode.getCameras()) as Camera[]
        if (cancelled || !devices.length) { setPhase('denied'); return }
        setCameras(devices)
        // Prefer rear camera
        const backIdx = devices.findIndex(d => /back|rear|environment/i.test(d.label))
        const idx = backIdx >= 0 ? backIdx : 0
        setCamIdx(idx)
        await doStart(devices[idx].id)
      } catch {
        if (!cancelled) setPhase('denied')
      }
    }
    // Small delay lets the div lay out before the library reads its width
    const t = setTimeout(init, 80)
    return () => { cancelled = true; clearTimeout(t); doStop() }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Flip camera ────────────────────────────────────────────────────────────

  const handleFlip = async () => {
    if (cameras.length < 2) return
    const next = (camIdx + 1) % cameras.length
    setCamIdx(next)
    await doStop()
    await doStart(cameras[next].id)
  }

  // ── Render via portal (bypasses backdrop-filter stacking context) ──────────

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="fixed inset-0 flex flex-col"
      style={{ zIndex: 70, background: 'rgba(2, 6, 23, 0.97)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' }}
    >
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-shrink-0" style={{ padding: '20px 24px 16px' }}>
        <div>
          <h2 className="font-bold text-base" style={{ color: '#f1f5f9' }}>Scan QR Code</h2>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(241,245,249,0.35)' }}>
            Point your camera at a 2FA QR code
          </p>
        </div>
        <button
          onClick={onClose}
          className="flex items-center justify-center w-10 h-10 rounded-full transition-all hover:opacity-70 active:scale-95 flex-shrink-0"
          style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(241,245,249,0.5)' }}
        >
          <CloseIcon />
        </button>
      </div>

      {/* ── Main ───────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center min-h-0">

        {/* Camera denied */}
        {phase === 'denied' && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-6 px-8 text-center"
            style={{ maxWidth: 380 }}
          >
            <div
              className="flex items-center justify-center rounded-full flex-shrink-0"
              style={{ width: 96, height: 96, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}
            >
              <CameraBlockedIcon />
            </div>
            <div>
              <h3 className="font-bold text-lg mb-2" style={{ color: '#f1f5f9' }}>Camera Restricted</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(241,245,249,0.45)' }}>
                Camera access is required to scan QR codes. Grant permission in your browser settings, then try again.
              </p>
            </div>
            <div
              className="w-full rounded-2xl p-4 text-left"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <p className="text-xs font-semibold mb-2" style={{ color: 'rgba(241,245,249,0.55)', letterSpacing: '0.06em' }}>
                HOW TO ENABLE
              </p>
              {[
                ['Safari',  'Settings → Safari → Camera → Allow'],
                ['Chrome',  'Address bar lock icon → Camera → Allow'],
                ['Firefox', 'Address bar camera icon → Allow'],
              ].map(([browser, steps]) => (
                <p key={browser} className="text-xs mb-1 last:mb-0" style={{ color: 'rgba(241,245,249,0.38)' }}>
                  <span style={{ color: 'rgba(241,245,249,0.62)', fontWeight: 600 }}>{browser}: </span>
                  {steps}
                </p>
              ))}
            </div>
            <button onClick={onClose} className="btn-glow px-8 py-3 rounded-2xl text-sm">
              Go Back
            </button>
          </motion.div>
        )}

        {/* Success flash */}
        {phase === 'success' && (
          <motion.div
            initial={{ scale: 0.75, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 14, stiffness: 200 }}
            className="flex flex-col items-center gap-5 text-center"
          >
            <div
              className="flex items-center justify-center rounded-full"
              style={{
                width: 128, height: 128,
                background: 'rgba(16,185,129,0.10)',
                border: '2px solid rgba(16,185,129,0.4)',
                color: '#10b981',
                boxShadow: '0 0 64px rgba(16,185,129,0.3)',
              }}
            >
              <CheckIcon />
            </div>
            <div>
              <p className="font-bold text-lg" style={{ color: '#f1f5f9' }}>Code Detected!</p>
              <p className="text-sm mt-1" style={{ color: 'rgba(241,245,249,0.4)' }}>Pre-filling your account details…</p>
            </div>
          </motion.div>
        )}

        {/* Scanner */}
        {(phase === 'starting' || phase === 'scanning') && (
          <div className="flex flex-col items-center gap-6 w-full px-6">

            {/* Viewport */}
            <div
              className="relative rounded-2xl overflow-hidden flex-shrink-0"
              style={{ width: VF + 64, height: VF + 64, maxWidth: '90vw', maxHeight: '90vw', background: '#000' }}
            >
              {/* Library injects video here */}
              <div id={SCANNER_ID} style={{ position: 'absolute', inset: 0 }} />

              {/* Vignette — darken 32px margins around viewfinder */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: [
                    'linear-gradient(to right,  rgba(2,6,23,0.6) 32px, transparent 32px, transparent calc(100% - 32px), rgba(2,6,23,0.6) calc(100% - 32px))',
                    'linear-gradient(to bottom, rgba(2,6,23,0.6) 32px, transparent 32px, transparent calc(100% - 32px), rgba(2,6,23,0.6) calc(100% - 32px))',
                  ].join(','),
                }}
              />

              {/* Viewfinder frame: corners + scan line */}
              <div
                className="absolute pointer-events-none"
                style={{ top: 32, left: 32, bottom: 32, right: 32 }}
              >
                {CORNERS.map((style, i) => (
                  <div
                    key={i}
                    className="absolute"
                    style={{ ...style, width: 26, height: 26, boxShadow: '0 0 10px rgba(0,194,255,0.65)' }}
                  />
                ))}

                <motion.div
                  animate={{ y: [2, VF - 4] }}
                  transition={{ duration: 2.2, ease: 'easeInOut', repeat: Infinity, repeatType: 'mirror' }}
                  style={{
                    position: 'absolute',
                    left: 10, right: 10, top: 0,
                    height: 2, borderRadius: 2,
                    background: 'linear-gradient(90deg, transparent, rgba(0,194,255,0.85), transparent)',
                    boxShadow: '0 0 12px rgba(0,194,255,0.7)',
                  }}
                />
              </div>

              {/* Starting spinner */}
              {phase === 'starting' && (
                <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(2,6,23,0.85)' }}>
                  <div
                    className="w-8 h-8 rounded-full animate-spin"
                    style={{ border: '2px solid rgba(0,194,255,0.18)', borderTopColor: '#00c2ff' }}
                  />
                </div>
              )}
            </div>

            {/* Bad scan warning */}
            {badScan && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-center"
                style={{ color: '#f87171' }}
              >
                Not a valid OTPAuth QR code — keep scanning…
              </motion.p>
            )}
          </div>
        )}
      </div>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      {(phase === 'scanning' || phase === 'starting') && (
        <div
          className="flex items-center justify-center flex-shrink-0"
          style={{ padding: '20px 24px 48px' }}
        >
          {cameras.length > 1 && (
            <button
              onClick={handleFlip}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all hover:opacity-70 active:scale-95"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(241,245,249,0.55)',
              }}
            >
              <SwitchCameraIcon />
              Flip Camera
            </button>
          )}
        </div>
      )}
    </motion.div>,
    document.body
  )
}
