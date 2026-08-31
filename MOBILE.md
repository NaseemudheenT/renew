# Renew — native app (iOS + Android via Capacitor)

Renew ships as **one codebase**: the website, an installable PWA, and native
apps for the App Store and Play Store. The native apps are a **Capacitor** shell
around the live web app, plus native plugins for device features.

## How it works (and why)

Renew is a **server-rendered Next.js app** (App Router, API routes, signed server
sessions). That can't be exported into a static bundle, so the native shell
**loads the live app from `https://getrenew.in`** (`capacitor.config.ts` →
`server.url`) and native plugins add what a browser can't do. `mobile-shell/` is
just the cold-start / offline splash.

Trade-off to know: because the app loads a hosted URL, Apple review can flag
"minimum functionality." We counter that with real native features (biometric
unlock, camera capture, push, and the Android UPI tracker) so it's a genuine app,
not a bookmark. Everything below is designed around that.

## What's already set up ✅

- `@capacitor/core`, `@capacitor/ios`, `@capacitor/android`, `@capacitor/cli`
- `capacitor.config.ts` — appId `in.getrenew.app`, appName `Renew`, loads getrenew.in
- `mobile-shell/index.html` — splash fallback
- npm scripts: `cap:add:ios`, `cap:add:android`, `cap:sync`, `cap:ios`, `cap:android`

## Prerequisites (run locally — needs your machine + accounts)

**iOS**
- macOS + **Xcode** (installed) and **CocoaPods** — `sudo gem install cocoapods`
  (or `brew install cocoapods`)
- An **Apple Developer** account ($99/yr) for signing + App Store submission

**Android**
- **Android Studio** + SDK; set `ANDROID_HOME`
- A **Google Play Console** account ($25 once)

## Generate + open the native projects

```bash
npm run cap:add:ios       # creates ios/  (needs CocoaPods)
npm run cap:add:android   # creates android/  (needs Android SDK)
npm run cap:sync          # copies config + plugins into the native projects
npm run cap:ios           # opens Xcode
npm run cap:android       # opens Android Studio
```

Build/run from Xcode / Android Studio onto a simulator or device. Re-run
`npm run cap:sync` after changing `capacitor.config.ts` or adding a plugin.

## App icon + splash

Use `@capacitor/assets`: drop a 1024×1024 `icon.png` and a splash into
`assets/`, then `npx @capacitor/assets generate`. Brand: champagne wordmark on
`#060a18` (matches `mobile-shell`).

## The UPI-notification auto-tracker (Android — the flagship native feature)

Goal: when the user pays via GPay/PhonePe/Paytm etc., Renew reads the payment
notification and offers to add the expense automatically.

- Android only, via a **NotificationListenerService** (a small custom Capacitor
  plugin under `android/`). iOS does **not** allow reading other apps'
  notifications — there's no equivalent, so iOS stays manual + Ren voice/scan.
- Requires the user to grant "Notification access" (a system settings screen);
  we ask explicitly with a clear explanation.
- The plugin parses `{app, title, text}` → amount + merchant, then hands it to
  the existing deterministic parser (`lib/ren.ts` / `lib/import.ts`) and shows a
  one-tap "Add this?" — never auto-saves silently. All parsing stays on-device.
- Plan: scaffold `RenewUpiListener` plugin → emit events to JS → a small
  in-app "Detected a payment" confirm sheet.

## Suggested native plugins to add

- `@capacitor/preferences` — small device settings
- `@capacitor/push-notifications` — reminders/bills push
- `@capacitor/camera` — receipt capture (feeds the scanner)
- `@capacitor-community/biometric-auth` (or native) — Face ID / fingerprint unlock
- `@capacitor/app`, `@capacitor/status-bar`, `@capacitor/splash-screen` — polish

## Store submission checklist

- [ ] Icons + splash generated
- [ ] Privacy policy + terms URLs (already live: /privacy, /terms)
- [ ] Data-safety / App Privacy forms (we store financial data; declare it)
- [ ] Signing: iOS provisioning profile; Android upload key / Play App Signing
- [ ] Screenshots per device class
- [ ] Test on real devices (login, Ren voice, camera, deep links)
