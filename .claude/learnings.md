# Learnings — Authenticator Application

## [2026-03-18] - Bootstrap

Initial project bootstrap. Key discoveries:

- App.tsx still contains Vite template boilerplate — needs to be replaced with actual authenticator UI before any feature work
- No test suite configured — Vitest is the recommended addition (Vite-native)
- localStorage is unencrypted — secrets are plaintext; keep in mind for any security-sensitive feature requests
- `useAccounts.ts` uses `crypto.randomUUID()` for IDs — no external UUID library needed
- `html5-qrcode` requires camera permissions at runtime; handle gracefully in UI
- `CountdownRing.tsx` is a pure presentational component — no state, just props
- Color palette is defined as a constant array in `useAccounts.ts` and rotated by index modulo array length
