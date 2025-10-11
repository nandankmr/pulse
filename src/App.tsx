/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import { StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { store } from './store';
import {
  Provider as PaperProvider,
  MD3LightTheme,
  MD3DarkTheme,
} from 'react-native-paper';
import { ThemeProvider } from './theme/ThemeContext';
import { colors } from './theme';
import AppNavigator from './navigation/AppNavigator';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  const paperTheme = isDarkMode
    ? { ...MD3DarkTheme, colors: { ...MD3DarkTheme.colors, ...colors.dark } }
    : {
        ...MD3LightTheme,
        colors: { ...MD3LightTheme.colors, ...colors.light },
      };

  return (
    <ThemeProvider>
      <PaperProvider theme={paperTheme}>
        <Provider store={store}>
          <SafeAreaProvider>
            <StatusBar
              barStyle={isDarkMode ? 'light-content' : 'dark-content'}
            />
            <AppNavigator />
          </SafeAreaProvider>
        </Provider>
      </PaperProvider>
    </ThemeProvider>
  );
}

export default App;
