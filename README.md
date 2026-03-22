# Heiyo Authenticator

A privacy-first 2FA code manager that runs entirely in your browser. No servers, no accounts, no data leaving your device.

---

## What it does

Heiyo generates time-based one-time passwords (TOTP) — the 6-digit codes used by apps like Google, GitHub, Stripe, and thousands of others when you enable two-factor authentication.

Every code is generated locally using the industry-standard RFC 6238 algorithm. Nothing is sent over the network.

---

## Key features

- **Encrypted vault** — your secrets are protected by a master password using AES-GCM encryption before being stored in the browser
- **QR code scanning** — point your camera at a QR code to add an account instantly
- **Manual entry** — paste or type a secret key directly if you prefer
- **Live countdown** — a radial timer shows exactly when each code expires (30-second window)
- **Copy to clipboard** — tap any card to copy the current code
- **Backup & restore** — export an encrypted backup file and import it on any device
- **Clock sync** — automatically detects and corrects for system clock drift so codes are always valid
- **Offline-ready** — works with no internet connection once loaded

---

## Privacy model

| What happens | Detail |
|---|---|
| Secrets stored | Encrypted in `localStorage`, never sent anywhere |
| Master password | Never stored — used only to derive the encryption key |
| Network requests | None after initial page load |
| Analytics / tracking | None |

---

## Adding your first account

1. Open the app and create a vault with a master password
2. Click **+** in the top nav
3. Either scan the QR code shown by your service, or paste the secret key manually
4. Your account appears immediately with a live code

---

## Backup your vault

Go to **My Codes** and click the export icon in the toolbar. This downloads an encrypted `.json` file. To restore, click the import icon and select the file — you'll need your original master password to unlock it.

---

## Running locally

```bash
npm install
npm run dev
```

Requires Node 18+. Opens at `http://localhost:5173`.

```bash
npm run build    # production build → dist/
npm run preview  # preview the production build locally
```

---

## Tech

React 19 · TypeScript · Vite · Tailwind CSS · otplib · Framer Motion · Web Crypto API
