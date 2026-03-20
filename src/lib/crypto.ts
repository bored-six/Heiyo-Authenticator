// AES-GCM-256 + PBKDF2 (600k iterations) encryption utilities
// Verification: SHA-256 of the derived key bytes (requires extractable: true)
// Security note: extractable key is acceptable here — PBKDF2 brute-force cost
// (600k iters) is the real protection; key is only ever in JS memory.

const PBKDF2_ITERATIONS = 600_000
const IV_LENGTH = 12
const SALT_LENGTH = 16

function toBase64(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}

function fromBase64(str: string): Uint8Array<ArrayBuffer> {
  const binary = atob(str)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

export function generateSalt(): Uint8Array<ArrayBuffer> {
  return crypto.getRandomValues(new Uint8Array(SALT_LENGTH))
}

async function deriveAesKey(password: string, salt: Uint8Array<ArrayBuffer>): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  )
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true, // extractable so we can compute verification hash
    ['encrypt', 'decrypt']
  )
}

async function computeVerificationHash(key: CryptoKey): Promise<string> {
  const raw = await crypto.subtle.exportKey('raw', key)
  const hash = await crypto.subtle.digest('SHA-256', raw)
  return toBase64(hash)
}

export async function createMasterKey(
  password: string,
  salt: Uint8Array<ArrayBuffer>
): Promise<{ key: CryptoKey; verificationHash: string; saltBase64: string }> {
  const key = await deriveAesKey(password, salt)
  const verificationHash = await computeVerificationHash(key)
  return { key, verificationHash, saltBase64: toBase64(salt) }
}

export async function verifyAndDeriveKey(
  password: string,
  saltBase64: string,
  storedHash: string
): Promise<CryptoKey | null> {
  const salt = fromBase64(saltBase64)
  const key = await deriveAesKey(password, salt)
  const hash = await computeVerificationHash(key)
  if (hash !== storedHash) return null
  return key
}

export async function encryptData(
  plaintext: string,
  key: CryptoKey
): Promise<{ ciphertext: string; iv: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(plaintext)
  )
  return { ciphertext: toBase64(encrypted), iv: toBase64(iv) }
}

export async function decryptData(
  ciphertext: string,
  ivBase64: string,
  key: CryptoKey
): Promise<string> {
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: fromBase64(ivBase64) },
    key,
    fromBase64(ciphertext)
  )
  return new TextDecoder().decode(decrypted)
}
