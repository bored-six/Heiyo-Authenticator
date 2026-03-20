# Tech Rules — Authenticator Application

## Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Language | TypeScript | 5.9.3 (strict) |
| Framework | React | 19.2.4 |
| Build | Vite | 8.0.0 |
| Styling | Tailwind CSS | 4.2.1 |
| TOTP | otplib | 13.3.0 |
| QR Scan | html5-qrcode | 2.3.8 |
| QR Gen | qrcode.react | 4.2.0 |

## TypeScript Rules

- `strict: true` — no implicit any
- `noUnusedLocals` and `noUnusedParameters` are enabled — clean up before building
- `erasableSyntaxOnly: true` — no enums or namespaces
- Target: ES2023, module: ESNext, bundler resolution

## Patterns

- **Functional components only** — no class components
- **Custom hooks** for all stateful logic — components only render
- **Tailwind only** for styling — no inline styles, no CSS modules
- **No prop drilling** beyond 2 levels — extract to hooks or context
- localStorage key for accounts: `auth_accounts`
- Account IDs: `crypto.randomUUID()`

## Build Commands

```bash
npm run dev        # Vite dev server
npm run build      # tsc -b && vite build
npm run lint       # eslint .
npm run preview    # vite preview
```

## No Backend

This is a fully static, client-side app. There are no:
- API calls
- Environment variables for endpoints
- Authentication tokens
- Server deployments

## Testing (Not Yet Configured)

When adding tests, use **Vitest** — it is Vite-native and requires no separate config. Add `vitest` to devDependencies and `"test": "vitest"` to package.json scripts.
