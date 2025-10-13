/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import { StatusBar, useColorScheme, View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
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
import { useAuthRestore } from './hooks/useAuthRestore';

const queryClient = new QueryClient();

function AppContent() {
  const { isRestoring } = useAuthRestore();
  const isDarkMode = useColorScheme() === 'dark';

  if (isRestoring) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: isDarkMode ? '#121212' : '#FFFFFF',
        }}
      >
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <AppNavigator />
    </>
  );
}

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  const paperTheme = isDarkMode
    ? { ...MD3DarkTheme, colors: { ...MD3DarkTheme.colors, ...colors.dark } }
    : {
        ...MD3LightTheme,
        colors: { ...MD3LightTheme.colors, ...colors.light },
      };
  return (
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <ThemeProvider>
          <PaperProvider theme={paperTheme}>
            <Provider store={store}>
              <SafeAreaProvider>
                <AppContent />
              </SafeAreaProvider>
            </Provider>
          </PaperProvider>
        </ThemeProvider>
      </I18nextProvider>
    </QueryClientProvider>
  );
}

export default App;
