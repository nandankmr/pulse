# React Native Project Initialization Plan

Based on the rules.md file, here is a detailed step-by-step plan to execute the React Native project setup for "pulse".

## Step 1: Project Initialization
- Use React Native CLI to create a new project with TypeScript template.
- Command: `npx react-native init pulse --template react-native-template-typescript`
- Ensure the project is created in the correct directory.

## Step 2: Install Dependencies
- Install navigation packages: `@react-navigation/native`, `@react-navigation/stack`, `@react-navigation/bottom-tabs`
- Install state management: `@reduxjs/toolkit`, `react-redux`
- Install networking: `axios`
- Install environment variables: `react-native-config`
- Install async storage: `@react-native-async-storage/async-storage`
- Install vector icons: `react-native-vector-icons`
- Install styling: `react-native-paper` (or `styled-components`)
- Install linting & formatting: `eslint`, `prettier`, `husky`, `lint-staged`
- Install testing: `jest`, `@testing-library/react-native`, `react-test-renderer`
- Run `yarn install` or `npm install` after adding packages.

## Step 3: Configuration Setup
- Configure ESLint with Airbnb or React Native rules.
- Set up Prettier for formatting.
- Enable Husky and lint-staged for pre-commit hooks.
- Enable TypeScript strict mode in tsconfig.json.
- Create a GitHub Actions CI YAML file for lint, type-check, and tests.

## Step 4: Folder Structure Scaffolding
- Create the src/ directory with subdirectories: api/, assets/, components/, constants/, hooks/, navigation/, screens/, store/, theme/, types/, utils/
- Move App.tsx to src/ if needed and ensure proper imports.

## Step 5: Theming & UI Setup
- Create src/theme/ with colors, spacing, typography.
- Implement dark/light mode toggle using React Context.
- Configure global fonts and icons.

## Step 6: State Management Implementation
- Create src/store/userSlice.ts with the provided example.
- Set up Redux store and provider in App.tsx.

## Step 7: Navigation Setup
- Create src/navigation/AppNavigator.tsx with the provided example.
- Integrate NavigationContainer and stack navigator.

## Step 8: Environment & Config
- Create .env file with API_URL and ENV variables.
- Configure react-native-config to load .env.

## Step 9: Testing Setup
- Set up Jest configuration.
- Create example test files for components.

## Step 10: Documentation & Validation
- Generate a detailed README.md with setup instructions, folder structure, commands.
- Run quality gates: `yarn lint`, `yarn test`, ensure no TypeScript errors, verify Android/iOS build.

## Optional Enhancements
- Integrate React Query for caching.
- Add i18n support, Crashlytics, etc., if time permits.

This plan can be executed step by step. Each step includes validation to ensure progress.
