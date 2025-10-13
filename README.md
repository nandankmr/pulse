# Pulse - Real-time Messaging App

A modern, feature-rich real-time messaging application built with React Native, TypeScript, and Socket.io.

## Features

- 🔐 **Authentication** - Email/password login, registration, email verification
- 👤 **Profile Management** - Edit profile, avatar upload, theme toggle
- 💬 **Real-time Messaging** - Instant messaging with Socket.io
- 📱 **Chat Management** - Chat list, search, unread badges
- 📎 **Rich Attachments** - Images, videos, location sharing
- 👥 **Group Management** - Create groups, add/remove members, role management
- 🌓 **Dark Mode** - Light/dark theme support
- ✅ **Read Receipts** - Message delivery status
- 🔔 **Typing Indicators** - See when others are typing
- 📍 **Location Sharing** - Share your current location

## Tech Stack

- **React Native 0.82.0** - Cross-platform mobile framework
- **TypeScript** - Type-safe development
- **Redux Toolkit** - State management
- **React Navigation** - Navigation library
- **React Native Paper** - Material Design components
- **Socket.io Client** - Real-time communication
- **Axios** - HTTP client
- **@react-native-community/geolocation** - Location services
- **react-native-image-picker** - Camera and gallery access

## Quick Start

### Prerequisites
- Node.js 18+ (Note: Project uses Node 18, but React Native 0.82 recommends Node 20+)
- npm or yarn

- Node.js >= 20
- React Native CLI
- Android Studio (for Android)
- Xcode (for iOS)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd pulse
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. For iOS (macOS only):
   ```bash
   npx pod-install ios
   ```

4. For Android:
   ```bash
   # Ensure Android emulator is running or device is connected
   ```

## Folder Structure

```
pulse/
├── android/                 # Android native code
├── ios/                     # iOS native code
├── src/                     # Source code
│   ├── api/                 # API related code
│   ├── assets/              # Images, fonts, etc.
│   ├── components/          # Reusable components
│   ├── constants/           # App constants
│   ├── hooks/               # Custom hooks
│   ├── navigation/          # Navigation setup
│   ├── screens/             # Screen components
│   ├── store/               # Redux store and slices
│   ├── theme/               # Theming and UI tokens
│   ├── types/               # TypeScript type definitions
│   ├── utils/               # Utility functions
│   └── App.tsx              # Main app component
├── .env                     # Environment variables (ignored in Git)
├── .github/workflows/       # CI/CD configuration
├── .husky/                  # Git hooks
├── __tests__/               # Test files
├── .editorconfig            # Editor configuration
├── .eslintrc.js             # ESLint configuration
├── .prettierrc              # Prettier configuration
├── tsconfig.json            # TypeScript configuration
├── package.json             # Dependencies and scripts
└── README.md                # This file
```

## Commands

### Development

- Start Metro bundler:
  ```bash
  npm start
  ```

- Run on Android:
  ```bash
  npm run android
  ```

- Run on iOS:
  ```bash
  npm run ios
  ```

- Run tests:
  ```bash
  npm test
  ```

- Run lint:
  ```bash
  npm run lint
  ```

### Building

- Build for Android:
  ```bash
  npx react-native run-android --variant=release
  ```

- Build for iOS:
  ```bash
  npx react-native run-ios --configuration=Release
  ```

## Adding New Features

### Adding New Screens

1. Create a new screen in `src/screens/` (e.g., `NewScreen.tsx`).
2. Add the screen to `src/navigation/AppNavigator.tsx` in the Stack.Navigator.
3. Update navigation types if needed.

### Adding New Redux Slices

1. Create a new slice in `src/store/` (e.g., `newSlice.ts`).
2. Add the reducer to `src/store/index.ts`.
3. Use the slice in components with `useSelector` and `useDispatch`.

### Adding New Navigation Routes

1. Import the new screen in `AppNavigator.tsx`.
2. Add a new Stack.Screen in the Stack.Navigator.

## Quality Gates

The project includes automated quality checks:

- **Linting**: ESLint with Airbnb/React Native rules
- **Formatting**: Prettier
- **Type Checking**: TypeScript strict mode
- **Testing**: Jest with React Native Testing Library
- **Pre-commit Hooks**: Runs lint, format, and tests before commits
- **CI/CD**: GitHub Actions for automated checks on PRs

## Environment Variables

The app uses `react-native-config` for environment variables.

Create a `.env` file (already ignored in Git) with:

```
API_URL=https://api.example.com
ENV=development
```

Access in code with:

```ts
import Config from 'react-native-config';

const apiUrl = Config.API_URL;
```

## Contributing

1. Create a feature branch.
2. Make your changes.
3. Run `npm test` and `npm run lint`.
4. Commit with conventional commit messages.
5. Push and create a PR.

## License

This project is licensed under the MIT License."Reload"** from the **Dev Menu**, accessed via <kbd>Ctrl</kbd> + <kbd>M</kbd> (Windows/Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (macOS).
- **iOS**: Press <kbd>R</kbd> in iOS Simulator.

## Congratulations! :tada:

You've successfully run and modified your React Native App. :partying_face:

### Now what?

- If you want to add this new React Native code to an existing application, check out the [Integration guide](https://reactnative.dev/docs/integration-with-existing-apps).
- If you're curious to learn more about React Native, check out the [docs](https://reactnative.dev/docs/getting-started).

# Troubleshooting

If you're having issues getting the above steps to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

# Learn More

To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.
