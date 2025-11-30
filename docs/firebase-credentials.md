# Firebase Credentials Setup

This guide walks through extracting Firebase configuration values from the Firebase console and wiring them into the Pulse mobile app and backend.

---

## 1. Collect Firebase Project Credentials

1. **Open Firebase console** at https://console.firebase.google.com/ and select the correct project.
2. Navigate to **Project Settings → General**.
3. Under **Your apps**, pick the relevant platform (iOS, Android, or Web). If the app isnt registered yet, create a new app entry first.
4. Copy the following values:
   - **`apiKey`**
   - **`authDomain`** (web only)
   - **`projectId`**
   - **`storageBucket`**
   - **`messagingSenderId`**
   - **`appId`**
   - **`measurementId`** (if available)
5. For backend token verification, download the **Service Account** credentials:
   - Go to **Service accounts** tab.
   - Click **Generate new private key** to download a JSON file containing:
     - `project_id`
     - `client_email`
     - `private_key`
   - Store this file securely. Youll use values from it in server environment variables.

---

## 2. Configure Backend (`pulse-api`)

1. Set the following environment variables (e.g., in `.env`):

   ```env
   AUTH_PROVIDER=firebase
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk@example.iam.gserviceaccount.com
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   ```

   **Notes**:
   - Preserve newline characters in `FIREBASE_PRIVATE_KEY` by escaping them (`\n`).
   - Keep the service-account JSON outside version control.

2. Restart the backend server so the new configuration is picked up.

---

## 3. Configure Mobile App (`pulse`)

1. Update the Firebase config object (once available) inside the app:

   ```ts
   const firebaseConfig = {
     apiKey: 'your-api-key',
     authDomain: 'your-project.firebaseapp.com',
     projectId: 'your-project-id',
     storageBucket: 'your-project.appspot.com',
     messagingSenderId: '1234567890',
     appId: '1:1234567890:web:abcdef',
     measurementId: 'G-XXXXXXXXXX',
   };
   ```

2. Ensure the hardcoded auth toggle (`config.USE_FIREBASE_AUTH`) is set appropriately for the environment.

3. For native builds:
   - **Android**: place the downloaded `google-services.json` in `android/app/`.
   - **iOS**: add the `GoogleService-Info.plist` to the Xcode project.

4. Reinstall dependencies or rebuild the native app if requested by Firebase packages.

---

## 4. Verification Checklist

- **Backend**: `AUTH_PROVIDER=firebase`, service account env vars configured, server restarts without errors.
- **Mobile app**: Firebase SDK initialized with correct config, toggle enabled for Firebase mode.
- **End-to-end**: Login, logout, and token refresh succeed using Firebase credentials.

---

Keep this document updated if the Firebase project or configuration changes.
