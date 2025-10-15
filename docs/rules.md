# 🧠 React Native Project Initialization (Full Best Practices)

> **Role:** You are an expert React Native architect and senior mobile engineer specializing in production-grade apps with TypeScript, modular architecture, scalable state management, and performance optimization.  
>  
> **Goal:** Initialize a new React Native project that follows modern, enterprise-level best practices — focusing on scalability, maintainability, performance, and developer experience.  
>  
> **Deliverable:** A fully configured React Native project scaffold ready for feature development, with detailed file structure, configuration files, and key implementation examples.

---

## 1️⃣ Project Setup
- Use **React Native CLI** (not Expo) unless otherwise specified.
- Initialize with **TypeScript**.
- Name: `pulse` (can be parameterized).
- Directory structure must be clean, modular, and scalable.

**Example folder structure:**
```
pulse/
├── android/
├── ios/
├── src/
│   ├── api/
│   ├── assets/
│   ├── components/
│   ├── constants/
│   ├── hooks/
│   ├── navigation/
│   ├── screens/
│   ├── store/
│   ├── theme/
│   ├── types/
│   ├── utils/
│   └── App.tsx
├── .editorconfig
├── .eslintrc.js
├── .prettierrc
├── tsconfig.json
├── package.json
└── README.md
```

---

## 2️⃣ Configuration and Dependencies
- Add and configure the following packages:
  - **Navigation:** `@react-navigation/native`, `@react-navigation/stack`, `@react-navigation/bottom-tabs`
  - **State Management:** `@reduxjs/toolkit`, `react-redux`
  - **Networking:** `axios`
  - **Environment variables:** `react-native-config`
  - **Async storage:** `@react-native-async-storage/async-storage`
  - **Vector icons:** `react-native-vector-icons`
  - **Styling:** `react-native-paper` or `styled-components`
  - **Linting & formatting:** `eslint`, `prettier`, `husky`, `lint-staged`
  - **Type safety:** `typescript`, `@types/*`
  - **Testing:** `jest`, `@testing-library/react-native`, `react-test-renderer`

---

## 3️⃣ Code Quality & Automation
- Configure **ESLint** with Airbnb or recommended React Native rules.
- Set up **Prettier** for formatting.
- Enable **Husky + lint-staged** to run lint/format before commits.
- Enable **TypeScript strict mode**.
- Include a **GitHub Actions CI** YAML file that runs lint, type-check, and tests on every push/PR.

---

## 4️⃣ Theming & UI
- Centralize theme colors, spacing, and typography under `src/theme/`.
- Use a **dark/light mode toggle** using React Context.
- Ensure consistent UI tokens and responsive design patterns.
- Configure global fonts and icons.

---

## 5️⃣ State Management Example
Example `userSlice.ts`:
```ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UserState {
  name: string;
  email: string;
}

const initialState: UserState = {
  name: '',
  email: '',
};

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<UserState>) => {
      return { ...state, ...action.payload };
    },
    clearUser: () => initialState,
  },
});

export const { setUser, clearUser } = userSlice.actions;
export default userSlice.reducer;
```

---

## 6️⃣ Navigation Example
Example `AppNavigator.tsx`:
```ts
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

---

## 7️⃣ Environment & Config
- Use `.env` file with `react-native-config` for all secrets (API URLs, keys).
- Example `.env`:
  ```
  API_URL=https://api.example.com
  ENV=development
  ```

---

## 8️⃣ Testing
Example component test:
```ts
import React from 'react';
import { render } from '@testing-library/react-native';
import HomeScreen from '../screens/HomeScreen';

test('renders correctly', () => {
  const { getByText } = render(<HomeScreen />);
  expect(getByText('Welcome')).toBeTruthy();
});
```

---

## 9️⃣ Documentation & README
Auto-generate a detailed README including:
- Setup instructions (`yarn install`, `npx pod-install`, etc.)
- Folder structure explanation
- Commands for `lint`, `test`, and `build`
- How to add new screens, slices, or navigation routes

---

## 🔟 Quality Gates
The AI agent must:
- Validate `yarn lint` passes
- Validate `yarn test` passes
- Validate project runs on both Android & iOS
- Ensure no TypeScript errors
- Include comments and docstrings in all example files

---

## 📦 Optional (Advanced Enhancements)
- Integrate **React Query** for caching & async state.
- Add **Crashlytics/Analytics** (if Firebase used).
- Add **i18n** support with `react-i18next`.
- Add **fastlane** or **EAS build** setup for CI/CD.
- Add **code-push** or OTA updates setup.

---

## 💬 Agent Instruction Summary
You are to:
1. Create a new React Native project (`npx react-native init pulse --template react-native-template-typescript`)
2. Install all recommended dependencies.
3. Configure ESLint, Prettier, Husky, TypeScript, and Jest.
4. Scaffold the described folder structure.
5. Implement example screens, navigation, and Redux slice.
6. Generate a README.md with documentation.
7. Output the complete folder and file contents as code blocks with explanations.
