// __tests__/HomeScreen.test.tsx

import React from 'react';
import { render } from '@testing-library/react-native';
import { ThemeProvider } from '../src/theme/ThemeContext';
import HomeScreen from '../src/screens/HomeScreen';

test('renders correctly', () => {
  const { getByText } = render(
    <ThemeProvider>
      <HomeScreen />
    </ThemeProvider>,
  );
  expect(getByText('Welcome to Home Screen')).toBeTruthy();
});
