import { useState, useEffect } from 'react'
import { generateSync } from 'otplib'

const PERIOD = 30

export function useTotp(secret: string) {
  const getCode = () => {
    try {
      return generateSync({ secret })
    } catch {
      return '------'
    }
  }

  const getSecondsLeft = () => PERIOD - (Math.floor(Date.now() / 1000) % PERIOD)

  const [code, setCode] = useState(getCode)
  const [secondsLeft, setSecondsLeft] = useState(getSecondsLeft)

  useEffect(() => {
    setCode(getCode())

    const interval = setInterval(() => {
      const secs = getSecondsLeft()
      setSecondsLeft(secs)
      if (secs === PERIOD) {
        setCode(getCode())
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [secret])

  return { code, secondsLeft, progress: secondsLeft / PERIOD }
}
