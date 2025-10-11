/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import { NewAppScreen } from '@react-native/new-app-screen';
import { StatusBar, StyleSheet, useColorScheme, View } from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { Provider as PaperProvider, MD3LightTheme, MD3DarkTheme, adaptNavigationTheme } from 'react-native-paper';
import { ThemeProvider, useTheme } from './theme/ThemeContext';
import { colors } from './theme';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  const paperTheme = isDarkMode ? { ...MD3DarkTheme, colors: { ...MD3DarkTheme.colors, ...colors.dark } } : { ...MD3LightTheme, colors: { ...MD3LightTheme.colors, ...colors.light } };

  return (
    <ThemeProvider>
      <PaperProvider theme={paperTheme}>
        <SafeAreaProvider>
          <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
          <AppContent />
        </SafeAreaProvider>
      </PaperProvider>
    </ThemeProvider>
  );
}

function AppContent() {
  const safeAreaInsets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <NewAppScreen
        templateFileName="App.tsx"
        safeAreaInsets={safeAreaInsets}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
