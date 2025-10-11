// __tests__/HomeScreen.test.tsx

import React from 'react';
import { render } from '@testing-library/react-native';
import HomeScreen from '../src/screens/HomeScreen';

test('renders correctly', () => {
  const { getByText } = render(<HomeScreen />);
  expect(getByText('Welcome to Home Screen')).toBeTruthy();
});
