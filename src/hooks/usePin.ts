import { useState, useEffect } from 'react'

const PIN_KEY = 'auth_pin_hash'
const LOCKED_KEY = 'auth_locked'

function hashPin(pin: string): string {
  // Simple hash — not cryptographic, but prevents casual plaintext storage
  let hash = 0
  for (let i = 0; i < pin.length; i++) {
    hash = (hash << 5) - hash + pin.charCodeAt(i)
    hash |= 0
  }
  return hash.toString(36)
}

export function usePin() {
  const storedHash = localStorage.getItem(PIN_KEY)
  const [pinSet, setPinSet] = useState(!!storedHash)
  const [locked, setLocked] = useState(!!storedHash)

  useEffect(() => {
    if (storedHash) {
      sessionStorage.setItem(LOCKED_KEY, 'true')
    }
  }, [])

  const setPin = (pin: string) => {
    localStorage.setItem(PIN_KEY, hashPin(pin))
    setPinSet(true)
    setLocked(false)
  }

  const verifyPin = (pin: string): boolean => {
    const stored = localStorage.getItem(PIN_KEY)
    if (!stored) return true
    const valid = hashPin(pin) === stored
    if (valid) setLocked(false)
    return valid
  }

  const removePin = () => {
    localStorage.removeItem(PIN_KEY)
    setPinSet(false)
    setLocked(false)
  }

  const lock = () => setLocked(true)

  return { pinSet, locked, setPin, verifyPin, removePin, lock }
}
