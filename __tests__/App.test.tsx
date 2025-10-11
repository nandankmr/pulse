/**
 * @format
 */

jest.mock('@reduxjs/toolkit', () => ({
  configureStore: jest.fn(),
  createSlice: jest.fn(() => ({
    name: 'user',
    reducer: jest.fn(),
    actions: {},
  })),
}));
jest.mock('react-redux', () => ({
  Provider: ({ children }) => children,
}));
jest.mock('react-native-paper', () => ({
  Provider: ({ children }) => children,
  MD3LightTheme: {},
  MD3DarkTheme: {},
}));
jest.mock('../src/theme/ThemeContext', () => ({
  ThemeProvider: ({ children }) => children,
  useTheme: () => ({
    colors: {
      background: '#FFFFFF',
      text: '#000000',
    },
  }),
}));
jest.mock('../src/navigation/AppNavigator', () => 'AppNavigator');
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }) => children,
  useSafeAreaInsets: () => ({}),
}));
jest.mock('react-native', () => ({
  StatusBar: 'StatusBar',
  useColorScheme: () => 'light',
}));

// Then the test
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../src/App';

test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
});
