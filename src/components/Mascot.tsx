import { useState, useEffect, useRef } from 'react'

/* ─────────────────────────────────────────────
   Pixel art ghost — 20 × 16 sprite, 4 px/unit
   Harry Potter ghost style: pearlescent icy blue-silver
   Proper ghost shape: dome head, wide body, 3-bump wavy bottom
───────────────────────────────────────────── */

const PS = 4 // SVG units per pixel

const COLORS: Record<string, string | null> = {
  '.': null,       // transparent
  'D': '#2e4a6b',  // dark navy outline
  'S': '#cce0f4',  // body (icy blue)
  'H': '#eaf5ff',  // highlight (bright near-white)
  'K': '#162030',  // eye socket (very dark blue)
  'W': '#f0f8ff',  // eye shine (alice blue)
  'M': '#0d1a28',  // mouth open
}

//  Each row must be exactly 20 characters wide
//  Ghost shape: dome → wide body → 3-bump wavy bottom
//
//  Eyes: 4 px wide each, positioned symmetrically
//  Interior body width: 14 px (positions 3–16 inclusive)
//  Bump layout: SSSS|SSSS|SSSS with D separators at 7 and 12
const GRID = [
  '......DDDDDDDD......',  //  0  top dome arc
  '....DDSSHHHHSSDD....',  //  1  highlight band
  '...DSSHHHHHHHHSSD...',  //  2  head
  '..DSSHHHHHHHHHHSSD..',  //  3  head full width
  '..DSSSSSSSSSSSSSSD..',  //  4  face above eyes
  '..DSSKKKKSSKKKKSSD..',  //  5  eyes top   (4-wide eyes)
  '..DSSKWKKSSKWKKSSD..',  //  6  eyes (shine)
  '..DSSKKKKSSKKKKSSD..',  //  7  eyes bottom
  '..DSSSSSSSSSSSSSSD..',  //  8  face below eyes
  '..DSSSSSSSSSSSSSSD..',  //  9  body (mouth row)
  '..DSSSSSSSSSSSSSSD..',  // 10  body
  '..DSSSSSSSSSSSSSSD..',  // 11  body
  '..DSSSSDSSSSDSSSSD..',  // 12  body splits → 3 sections (D at 7,12)
  '..DDSSDDDSSDDDSSDD..',  // 13  bump arcs narrowing
  '....DDD..DDD..DDD...',  // 14  bump tips
]

// Blink: close eyes (replace shine row)
const BLINK: Record<number, string> = {
  6: '..DSSKKKKSSKKKKSSD..',
}

// Talk: open mouth
const TALK: Record<number, string> = {
  9: '..DSSSSSSMMSSSSSSD..',
}

/* ── GhostSvg — pure pixel art renderer ── */
interface GhostProps {
  talking:  boolean
  blinking: boolean
  width?:   number
  height?:  number
}

export function GhostSvg({ talking, blinking, width = 80, height = 64 }: GhostProps) {
  const svgW = 20 * PS  // 80
  const svgH = 15 * PS  // 60 (rows 0-14)

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${svgW} ${svgH}`}
      shapeRendering="crispEdges"
      style={{ imageRendering: 'pixelated' } as React.CSSProperties}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Ethereal icy glow */}
        <filter id="ghost-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#a8d4f0" floodOpacity="0.55" />
        </filter>
      </defs>

      <g filter="url(#ghost-glow)">
        {GRID.map((baseRow, y) => {
          const row =
            (talking  && TALK[y])  ||
            (blinking && BLINK[y]) ||
            baseRow

          return row.split('').map((ch, x) => {
            const fill = COLORS[ch]
            if (!fill) return null
            return (
              <rect
                key={`${x}-${y}`}
                x={x * PS}
                y={y * PS}
                width={PS}
                height={PS}
                fill={fill}
              />
            )
          })
        })}
      </g>
    </svg>
  )
}

/* ── Center ghost messages ── */
const CENTER_IDLE: string[] = [
  "boo. also enable 2FA on everything. boo.",
  "hot take: ghosts invented one-time passwords. disappear after 30s? classic.",
  "why do ghosts make great security guards? we. never. leave.",
  "30 seconds to live... (the code, not me, I'm already dead)",
  "I haunted a password manager once. very unsatisfying. TOTP hits different.",
  "some people fear death. I fear SMS-based 2FA.",
  "I don't have a body but I have EXCELLENT opsec.",
  "your codes are safer than my corporeal form. which is gone btw.",
  "BOO... k your second factor. security first.",
  "I tried to social engineer myself. I already know all my secrets.",
  "they say I'm invisible. my authentication logs disagree.",
  "if hackers can't see me, they definitely can't see your codes.",
  "I'm basically a cryptographic ghost — mathematically impossible to fake.",
  "no accounts yet huh. bold strategy. very insecure. very bold.",
  "tap the + up there. I'll haunt you if you don't.",
  "I have commitment issues but your 2FA codes don't.",
  "every 30 seconds I die a little. (the code. same thing.)",
  "RFC 6238: the spell that makes me useful. look it up.",
]

const CENTER_CLICK: string[] = [
  "okay OKAY I see you.",
  "ouch. ghosts have feelings too.",
  "you tapped me. now we're bonded forever. like a haunt.",
  "stop that. or don't. I literally cannot leave.",
  "BOO! your turn.",
  "I felt that in my ectoplasm.",
  "you again. I'm not complaining. just noting.",
  "alright fine. I'll stick around. not like I have a choice.",
  "that tickles. not really. I have no nerve endings.",
  "why are you tapping a ghost instead of adding an account. priorities.",
  "fine. you want attention. here's attention. happy?",
  "I've been tapped 0 times today. wait, 1. still basically 0.",
]

/* ── BlinkingGhost — interactive center mascot ── */
export function BlinkingGhost({ width = 110, height = 88 }: { width?: number; height?: number }) {
  const [blinking,  setBlinking]  = useState(false)
  const [talking,   setTalking]   = useState(false)
  const [excited,   setExcited]   = useState(false)
  const [visible,   setVisible]   = useState(false)
  const [message,   setMessage]   = useState('')

  const blinkRef    = useRef<ReturnType<typeof setTimeout> | null>(null)
  const idleRef     = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hideRef     = useRef<ReturnType<typeof setTimeout> | null>(null)
  const excitedRef  = useRef<ReturnType<typeof setTimeout> | null>(null)

  const scheduleBlink = () => {
    blinkRef.current = setTimeout(() => {
      setBlinking(true)
      setTimeout(() => { setBlinking(false); scheduleBlink() }, 140)
    }, 2_500 + Math.random() * 3_500)
  }

  const speak = (msg: string, fromClick = false) => {
    if (hideRef.current) clearTimeout(hideRef.current)
    setMessage(msg)
    setVisible(true)
    setTalking(true)
    if (fromClick) {
      setExcited(true)
      if (excitedRef.current) clearTimeout(excitedRef.current)
      excitedRef.current = setTimeout(() => setExcited(false), 700)
    }
    hideRef.current = setTimeout(() => {
      setTalking(false)
      setTimeout(() => setVisible(false), 400)
    }, 4_000)
  }

  const scheduleIdle = () => {
    idleRef.current = setTimeout(() => {
      speak(pickRandom(CENTER_IDLE))
      scheduleIdle()
    }, 9_000 + Math.random() * 12_000)
  }

  useEffect(() => {
    scheduleBlink()
    scheduleIdle()
    return () => {
      if (blinkRef.current)   clearTimeout(blinkRef.current)
      if (idleRef.current)    clearTimeout(idleRef.current)
      if (hideRef.current)    clearTimeout(hideRef.current)
      if (excitedRef.current) clearTimeout(excitedRef.current)
    }
  }, [])

  const handleTap = () => {
    if (idleRef.current) clearTimeout(idleRef.current)
    speak(pickRandom(CENTER_CLICK), true)
    scheduleIdle()
  }

  const floatAnim = excited
    ? 'mascotExcited 0.7s ease-in-out'
    : 'mascotFloat 3.2s ease-in-out infinite'

  return (
    <div className="relative flex flex-col items-center" style={{ width: width + 40 }}>
      {/* Speech bubble */}
      {visible && (
        <div
          className="absolute"
          style={{
            bottom: height + 10,
            left: '50%',
            transform: 'translateX(-50%)',
            animation: talking
              ? 'fadeInBubble 0.25s ease forwards'
              : 'fadeOutBubble 0.3s ease forwards',
            zIndex: 10,
            width: 200,
          }}
        >
          <div
            className="px-3 py-2 rounded-2xl text-xs leading-relaxed text-center"
            style={{
              background: 'rgba(255,255,255,0.92)',
              border: '1px solid rgba(139,92,246,0.18)',
              boxShadow: '0 4px 16px rgba(139,92,246,0.12)',
              color: '#1e1b4b',
            }}
          >
            {message}
          </div>
          {/* Tail pointing down */}
          <div style={{
            position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)',
            width: 0, height: 0,
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            borderTop: '7px solid rgba(255,255,255,0.92)',
          }} />
        </div>
      )}

      {/* Ghost */}
      <button
        onClick={handleTap}
        style={{
          background: 'none', border: 'none', padding: 0, cursor: 'pointer',
          animation: floatAnim,
          display: 'block',
        }}
        title="Tap me!"
      >
        <GhostSvg talking={talking} blinking={blinking} width={width} height={height} />
      </button>
    </div>
  )
}

/* ── Messages ── */
const MESSAGES = [
  "All your codes are safe with me.",
  "I solemnly swear I am protecting your accounts.",
  "Muggles can't brute-force what they can't see.",
  "No dark magic here — just TOTP.",
  "30 seconds and the code vanishes. Like me.",
  "Nearly Authenticated — that's what they call me.",
  "Your secrets are safer than Platform 9¾.",
  "2FA: even Voldemort couldn't crack this.",
  "I've haunted worse places than a phone.",
  "I basically never leave. Occupational ghost things.",
  "TOTP was standardized in RFC 6238. I memorized it.",
  "Every 30 seconds, new magic happens.",
  "No Dementors allowed in this vault.",
  "Tap me. I'm not going anywhere.",
  "Small ghost, vast security knowledge.",
]

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

/* ── Mascot component ── */
export function Mascot() {
  const [talking,  setTalking]  = useState(false)
  const [visible,  setVisible]  = useState(false)
  const [message,  setMessage]  = useState('')
  const [blinking, setBlinking] = useState(false)

  const scheduleRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hideRef     = useRef<ReturnType<typeof setTimeout> | null>(null)
  const blinkRef    = useRef<ReturnType<typeof setTimeout> | null>(null)

  const scheduleNext = () => {
    scheduleRef.current = setTimeout(() => {
      const msg = pickRandom(MESSAGES)
      setMessage(msg)
      setVisible(true)
      setTalking(true)
      hideRef.current = setTimeout(() => {
        setTalking(false)
        setTimeout(() => { setVisible(false); scheduleNext() }, 400)
      }, 4_500)
    }, 10_000 + Math.random() * 15_000)
  }

  const scheduleBlink = () => {
    blinkRef.current = setTimeout(() => {
      setBlinking(true)
      setTimeout(() => { setBlinking(false); scheduleBlink() }, 140)
    }, 3_000 + Math.random() * 4_000)
  }

  useEffect(() => {
    scheduleNext()
    scheduleBlink()
    return () => {
      if (scheduleRef.current) clearTimeout(scheduleRef.current)
      if (hideRef.current)     clearTimeout(hideRef.current)
      if (blinkRef.current)    clearTimeout(blinkRef.current)
    }
  }, [])

  const handleTap = () => {
    if (talking) return
    if (scheduleRef.current) clearTimeout(scheduleRef.current)
    if (hideRef.current)     clearTimeout(hideRef.current)
    setMessage(pickRandom(MESSAGES))
    setVisible(true)
    setTalking(true)
    hideRef.current = setTimeout(() => {
      setTalking(false)
      setTimeout(() => { setVisible(false); scheduleNext() }, 400)
    }, 4_500)
  }

  return (
    <div
      className="fixed bottom-5 right-4 z-30 flex flex-col items-end"
      style={{ pointerEvents: 'none' }}
    >
      {/* Speech bubble */}
      {visible && (
        <div
          className="relative mb-2"
          style={{
            animation: talking
              ? 'fadeInBubble 0.3s ease forwards'
              : 'fadeOutBubble 0.35s ease forwards',
            pointerEvents: 'none',
          }}
        >
          <div
            className="px-3 py-2 rounded-2xl text-xs leading-relaxed"
            style={{
              maxWidth: 172,
              textAlign: 'right',
              background: 'rgba(255, 255, 255, 0.92)',
              border: '1px solid rgba(139, 92, 246, 0.18)',
              boxShadow: '0 4px 16px rgba(139,92,246,0.1)',
              color: '#1e1b4b',
            }}
          >
            {message}
          </div>
          <div style={{
            position: 'absolute', bottom: -6, right: 18,
            width: 0, height: 0,
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            borderTop: '7px solid rgba(255,255,255,0.92)',
          }} />
        </div>
      )}

      {/* Pixel ghost */}
      <button
        onClick={handleTap}
        style={{
          pointerEvents: 'auto',
          background: 'none', border: 'none', padding: 0, cursor: 'pointer',
          animation: 'mascotFloat 3.2s ease-in-out infinite',
        }}
        title="Tap me!"
      >
        <GhostSvg talking={talking} blinking={blinking} />
      </button>
    </div>
  )
}
