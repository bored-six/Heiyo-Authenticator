# Product Rules — Authenticator Application

## What This App Does
Client-side TOTP authenticator. Users add 2FA accounts (via manual entry or QR scan) and get live 6-digit codes that refresh every 30 seconds. No backend, no login, no network calls.

## Core User Flows

1. **View codes** — See all accounts on the main screen with live codes + countdown
2. **Add account** — Via QR camera scan OR manual entry (name + issuer + secret)
3. **Copy code** — Tap/click a card to copy the current code to clipboard
4. **Delete account** — Long-press a card to reveal the delete button

## Business Rules

- TOTP period is always 30 seconds (RFC 6238)
- Codes go red at < 5 seconds remaining (visual urgency)
- Account colors cycle through 8-color palette in add order
- Secret input is normalized: whitespace stripped, uppercase enforced
- Account data persists across sessions via localStorage
- OTP Auth URI must follow: `otpauth://totp/{issuer}:{name}?secret={secret}&issuer={issuer}`

## Non-Goals

- No backend authentication
- No account syncing across devices
- No cloud storage
- No user accounts/login
