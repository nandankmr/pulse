# Push Notification Configuration & Verification

## Overview
Push notifications in Pulse combine the backend (`pulse-api/`) and React Native client (`pulse/`) using Firebase Cloud Messaging (FCM). This guide captures the required configuration steps and the validation checklist to ensure end-to-end delivery.

## Prerequisites
- Firebase project with FCM enabled.
- Apple Developer account with Push Notifications capability.
- Android SDK & Xcode environments ready for React Native builds.

## Firebase Console Setup
- **Create project**
  1. Sign in to the [Firebase Console](https://console.firebase.google.com/) and click *Add project*.
  2. Provide a project name, accept the Google Analytics defaults, and finish project creation.

- **Enable Cloud Messaging**
  1. Navigate to *Project settings → Cloud Messaging*.
  2. Verify that the Firebase Cloud Messaging API is enabled in the linked Google Cloud project (console may prompt you to enable it).

- **Register Android app & download `google-services.json`**
  1. Under *Project settings → General*, click *Add app* and choose Android.
  2. Enter the Android package name `com.pulse` (must match `android/app/build.gradle`).
  3. Optionally set app nickname and SHA-1/256 debugging keys (required for Google Sign-In or Dynamic Links).
  4. Click *Register app*, then download the generated `google-services.json` file.
  5. Place the file under `pulse/android/app/google-services.json`.

- **Register iOS app & download `GoogleService-Info.plist`**
  1. In *Project settings → General*, click *Add app* and choose iOS.
  2. Supply the iOS bundle identifier (e.g., `com.pulse`). The value must match `ios/pulse.xcodeproj` target settings.
  3. Optionally provide App Store ID (can be left blank for now).
  4. Click *Register app*, then download the `GoogleService-Info.plist` file.
  5. Add the plist to `pulse/ios/pulse/` and include it in the Xcode project (ensure it is part of the *pulse* target).

- **Generate Web API key & sender ID**
  1. Still under *Project settings → General*, note the *Web API Key* and *Project number* (used as FCM Sender ID). Store these in your secrets manager if the mobile app or backend needs them.

- **Create server key for backend**
  1. In *Project settings → Cloud Messaging*, locate the *Server key* (token labeled *Cloud Messaging API (Legacy)*). If absent, click *Generate key*.
  2. Store this key securely; the backend uses it when sending FCM messages. Avoid committing it to source control.

- **Create Firebase service account**
  1. Open the [Google Cloud Console](https://console.cloud.google.com/), select the Firebase project, and go to *IAM & Admin → Service Accounts*.
  2. Click *Create service account*, give it a descriptive name (e.g., `pulse-fcm-server`), and grant it the *Firebase Admin SDK Administrator Service Agent* role (or minimal roles required for messaging).
  3. After creation, choose *Add Key → Create new key → JSON* to download the service account credentials.
  4. Provide the JSON file to the backend (e.g., mount it in production and surface via `getFirebaseConfig()`); never commit it to the repo.

## Backend (`pulse-api/`)
- Environment: ensure FCM credentials are exposed through `getFirebaseConfig()` and that service account JSON is reachable.
- Database: run `npx prisma migrate dev --name add_push_token` followed by `npx prisma generate`.
- Tests: `npm test -- push/push.service.test.ts` validates token revocation logic.

## Android (`pulse/`)
- Place `google-services.json` under `android/app/`.
- `android/build.gradle`: includes `com.google.gms:google-services` classpath.
- `android/app/build.gradle`:
  - Applies `com.google.gms.google-services` plugin.
  - Adds Firebase BOM + `firebase-messaging` dependency.
- Manifest: `android/app/src/main/AndroidManifest.xml` registers `com.pulse.PulseFirebaseMessagingService` and sets `pulse_default_channel`.
- Channel string: `android/app/src/main/res/values/strings.xml` defines `pulse_default_channel` label.
- Optional: extend `PulseFirebaseMessagingService.kt` for background handling.

## iOS (`pulse/`)
- Add `ios/pulse/GoogleService-Info.plist` to the Xcode project.
- `ios/Podfile`: includes `Firebase/Core` & `Firebase/Messaging`; run `cd ios && pod install` after adding the plist.
- `AppDelegate.swift`: imports Firebase, calls `FirebaseApp.configure()`, registers for APNs, and forwards tokens to `Messaging.messaging().apnsToken`.
- Enable Push Notifications & Background Modes → Remote notifications in Xcode targets.

## Frontend (`pulse/`)
- Token management:
  - `src/services/pushTokenService.ts` handles permission requests, token registration (`/push/register`), refresh, and unregistration.
  - `src/hooks/usePushTokenRegistration.ts` links token lifecycle to authentication state.
  - `src/App.tsx` invokes `usePushTokenRegistration()` alongside sockets and notification hooks.
- Local notifications: `src/services/notificationService.ts` uses Notifee to present messages and must create the `pulse_default_channel` on Android.

## Validation Checklist
1. **Prepare builds**
   - Android: `npx react-native run-android` (ensure Metro server running).
   - iOS: `npx react-native run-ios` or open Xcode and run on a device/simulator (APNs requires real device).
2. **Authenticate**
   - Log in; observe backend logs for `/push/register` calls and token persistence in `push_tokens` table.
3. **Send message**
   - From another user/device, send a chat message; confirm `PushService` logs `Push notification dispatched` and FCM response counters.
4. **Receive notification**
   - Android: verify notification appears (foreground/background) with channel `Pulse Messages`.
   - iOS: confirm APNs alert; check that `AppDelegate` delegate methods fire (Xcode logs).
5. **Token refresh**
   - Use `messaging().deleteToken()` (debug menu) or reinstall app; ensure `onTokenRefresh` triggers re-registration.
6. **Logout**
   - Logout and confirm `/push/unregister` call succeeds; tokens should be revoked in DB.
7. **Invalid token cleanup**
   - Manually revoke an FCM token (console) and send message; backend should log revoked tokens (`revokeManyTokens`).

## Troubleshooting
- **No notification**: confirm Firebase config files are present, check backend for `PushToken delegate not available`, ensure `notificationService.initialize()` runs.
- **iOS silent failure**: verify APNs certificates/key, real device usage, and Background Modes settings.
- **Token duplicates**: run `push.repository.ts` queries to ensure `upsert` logic prevents duplicates.

## Maintenance Tips
- Rotate Firebase service accounts and Apple APNs keys periodically; update backend env vars accordingly.
- Monitor `push_tokens` for stale entries and schedule cleanup as needed.
- Extend Jest tests to cover additional push scenarios (e.g., multiple recipients) when mocks are available.
