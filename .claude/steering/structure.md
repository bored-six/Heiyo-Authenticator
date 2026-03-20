# Structure & Conventions — Authenticator Application

## File Layout

```
src/
├── types.ts              # All shared TypeScript interfaces — Account is defined here
├── App.tsx               # Root: composes AccountList + AddAccount + modals
├── index.css             # Global styles: Tailwind import + dark theme reset
├── components/
│   ├── TOTPCard.tsx      # One card per account — displays code, countdown, copy/delete
│   ├── AddAccount.tsx    # Modal: tab for manual entry + tab for QR scan
│   ├── CountdownRing.tsx # SVG ring — props: secondsLeft, progress, color
│   └── DevModule.tsx     # Dev-only: secret generator + code validator panel
└── hooks/
    ├── useTotp.ts        # Returns { code, secondsLeft, progress } — refreshes every 1s
    └── useAccounts.ts    # Returns { accounts, addAccount, removeAccount }
```

## Component Conventions

- One component per file, named same as the file
- Props typed inline (no separate `Props` type unless reused)
- Hooks live in `src/hooks/`, never inside component files
- No default exports from hooks — named exports only (consistency)

## Account Data Shape

```typescript
interface Account {
  id: string        // crypto.randomUUID()
  name: string      // e.g. "user@example.com"
  issuer: string    // e.g. "GitHub"
  secret: string    // Base32, uppercase, no whitespace
  color: string     // Hex from COLOR_PALETTE in useAccounts.ts
  createdAt: number // Date.now()
}
```

## Color Palette (useAccounts.ts)

Rotates in order:
`indigo` → `purple` → `pink` → `amber` → `emerald` → `blue` → `red` → `teal`

These are Tailwind color names. The actual hex values are defined in `useAccounts.ts`.

## State Persistence

- All accounts stored in `localStorage` under key `auth_accounts`
- Stored as JSON array of `Account` objects
- `useAccounts.ts` is the single source of truth — never read/write localStorage directly from components

## TOTP Constants (useTotp.ts)

- Period: 30 seconds
- Digits: 6
- Algorithm: SHA1 (otplib default)
- Countdown updates every 1 second via `setInterval`
- Returns `'------'` on invalid secret (graceful degradation)

## Naming Conventions

| Thing | Convention | Example |
|-------|-----------|---------|
| Components | PascalCase | `TOTPCard`, `AddAccount` |
| Hooks | camelCase with `use` prefix | `useTotp`, `useAccounts` |
| Types/Interfaces | PascalCase | `Account` |
| Constants | UPPER_SNAKE_CASE | `TOTP_PERIOD`, `COLOR_PALETTE` |
| CSS classes | Tailwind utilities only | `bg-gray-900 text-white` |
