# CLAUDE.md — Authenticator Application

## Project Overview

A client-side TOTP (Time-based One-Time Password) authenticator app built with React + TypeScript + Vite. Generates and manages 2FA codes without a backend.

---

## Tech Stack

- **Framework:** React 19 + TypeScript 5 (strict mode)
- **Build Tool:** Vite 8 with HMR
- **Styling:** Tailwind CSS 4
- **2FA:** otplib (TOTP generation), html5-qrcode (QR scan), qrcode.react (QR generation)
- **Persistence:** Browser localStorage (key: `auth_accounts`)
- **No backend** — fully client-side

---

## Project Structure

```
src/
├── types.ts              # Account interface (id, name, issuer, secret, color, createdAt)
├── App.tsx               # Root component — assembles the UI
├── components/
│   ├── TOTPCard.tsx      # Single account card with live TOTP code + countdown
│   ├── AddAccount.tsx    # Modal: manual entry or QR scan to add accounts
│   ├── CountdownRing.tsx # SVG circular countdown timer
│   └── DevModule.tsx     # Developer tools: secret gen + code validation
└── hooks/
    ├── useTotp.ts        # TOTP generation, 1s interval, secondsLeft/progress
    └── useAccounts.ts    # CRUD for accounts, localStorage sync, color rotation
```

---

## Coding Conventions

- **TypeScript strict mode** — no implicit any, no unused locals/params
- **Functional components only** — no class components
- **Custom hooks** for logic — keep components focused on rendering
- **Tailwind** for all styling — no inline styles, no CSS modules
- **No backend calls** — all logic is client-side
- **UUIDs** via `crypto.randomUUID()`
- **Secrets** stored normalized: stripped whitespace, uppercase Base32

---

## Key Business Rules

- TOTP period: 30 seconds (standard RFC 6238)
- Code turns red when < 5 seconds remain
- Accounts stored in localStorage as JSON array
- Color palette rotates across 8 colors: indigo, purple, pink, amber, emerald, blue, red, teal
- Secrets are normalized on input (trim + uppercase)
- OTP Auth URI format: `otpauth://totp/{issuer}:{name}?secret={secret}&issuer={issuer}`

---

## Development Commands

```bash
npm run dev       # Start dev server with HMR
npm run build     # Type-check + Vite build
npm run lint      # ESLint check
npm run preview   # Preview production build
```

---

## Current State (as of 2026-03-18)

### Implemented
- TOTP code generation + display (6-digit, formatted XXX XXX)
- Account management with localStorage persistence
- QR code scanning (camera) for adding accounts
- Manual account entry form
- Copy-to-clipboard with visual feedback
- Long-press to reveal delete button on cards
- Countdown ring SVG component
- Developer tools: secret generator + code validator
- Light aurora theme (`#f8f6ff` background, pastel orb gradients, glassmorphism cards)

### Not Yet Implemented
- Test suite (no Vitest/Jest configured)
- PWA support
- Encrypted localStorage
- Accessibility (ARIA labels)
- Account editing/reordering
- Import/export accounts
- App.tsx still has Vite template boilerplate (needs replacing)

---

## Security Considerations

- localStorage is unencrypted — secrets are readable by any JS on the page
- No clipboard API fallback for older browsers
- Camera permissions required for QR scan feature
- No rate limiting (client-only app, not applicable)

---

## Working Rules (Mandatory)

### 1. Clarify Before Starting
Before beginning any task, ask clarifying questions to ensure full alignment. Do not assume intent — confirm scope, edge cases, and expected outcome first.

### 2. Permanent Fixes Only
Prioritize solutions that resolve the root cause. Avoid band-aid patches (e.g. hiding a bug with a try/catch, hardcoding a workaround). If a permanent fix is complex, explain the trade-off and get approval before proceeding with a temporary measure.

### 3. SVG for All Icons and Symbols
Never use emoji characters in the UI. All icons, symbols, and visual indicators must be rendered as inline SVGs. SVGs must match the app's light aurora theme — background `#f8f6ff`, dark foreground `#1e1b4b`, with violet/indigo accents (`#7c3aed`, `#6366f1`). Use `stroke="currentColor"` so icons inherit color from their parent. Source from a consistent icon set where possible (e.g. Heroicons, Lucide).

### 4. Commit After Every Task
After completing a task:
1. Commit the changes using the ticket format below
2. Update `learnings.md` if a new pattern, anti-pattern, or discovery was made
3. Update the relevant PRD if requirements changed, new components were added, or logic was refactored
4. **Only update docs if the change is significant** — skip for trivial fixes (typo, label change, minor style tweak)

### 5. Ticket Format
All commits, PRDs, and references must use the format: `HAA-000`

**Examples:**
- `HAA-001` — first ticket
- `HAA-012` — twelfth ticket

**Commit format:**
```
{type}(HAA-000): {description}

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

**Types:** `feat` | `fix` | `refactor` | `test` | `docs` | `chore`

**PRD naming:** `HAA-000-brief-description.md`

---

## Testing

No test suite currently configured. When adding tests:
- Use **Vitest** (Vite-native, zero-config)
- Test hooks with `@testing-library/react-hooks`
- Test TOTP logic in `useTotp.ts` and `useAccounts.ts`
- Mock `Date.now()` for deterministic TOTP tests
