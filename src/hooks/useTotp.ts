import { useState, useEffect } from 'react'
import { generateSync, createGuardrails } from 'otplib'

const PERIOD = 30
// otplib v13 requires 16 bytes minimum by default, but many real-world TOTP
// secrets (e.g. Google Authenticator's 80-bit / 10-byte secrets) are shorter.
// Passing custom guardrails allows those secrets to work correctly.
const LENIENT_GUARDRAILS = createGuardrails({ MIN_SECRET_BYTES: 1 })

export function useTotp(secret: string, clockOffset = 0) {
  const getCode = (epochOffset = 0) => {
    try {
      return generateSync({ secret, guardrails: LENIENT_GUARDRAILS, epoch: Date.now() + clockOffset + epochOffset })
    } catch {
      return '------'
    }
  }

  const getSecondsLeft = () => {
    const trueNowSec = Math.floor((Date.now() + clockOffset) / 1000)
    return PERIOD - (trueNowSec % PERIOD)
  }

  const [code, setCode] = useState(() => getCode())
  const [nextCode, setNextCode] = useState(() => getCode(PERIOD * 1000))
  const [secondsLeft, setSecondsLeft] = useState(getSecondsLeft)

  useEffect(() => {
    setCode(getCode())
    setNextCode(getCode(PERIOD * 1000))

    const interval = setInterval(() => {
      const secs = getSecondsLeft()
      setSecondsLeft(secs)
      if (secs === PERIOD) {
        setCode(getCode())
        setNextCode(getCode(PERIOD * 1000))
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [secret])

  return { code, nextCode, secondsLeft, progress: secondsLeft / PERIOD }
}
