/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */
import 'react-native-gesture-handler';
import React, { useCallback, useEffect, useRef } from 'react';
import { StatusBar, useColorScheme, View, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import { Provider, useSelector } from 'react-redux';
import { store, RootState } from './store';
import {
  Provider as PaperProvider,
  MD3LightTheme,
  MD3DarkTheme,
} from 'react-native-paper';
import { ThemeProvider } from './theme/ThemeContext';
import { colors } from './theme';
import AppNavigator from './navigation/AppNavigator';
import { useAuthRestore } from './hooks/useAuthRestore';
import { useSocketConnection } from './hooks/useSocket';
import { useMessageNotifications } from './hooks/useNotifications';
import { usePushTokenRegistration } from './hooks/usePushTokenRegistration';
import { notificationService, NotificationPressPayload } from './services/notificationService';
import { addNavigationReadyListener, navigateToChat } from './navigation/navigationRef';

const queryClient = new QueryClient();

function AppContent() {
  const { isRestoring } = useAuthRestore();
  const isDarkMode = useColorScheme() === 'dark';
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const pendingNotificationRef = useRef<NotificationPressPayload | null>(null);
  const isAuthenticatedRef = useRef(isAuthenticated);

  const handleNotificationNavigation = useCallback((payload: NotificationPressPayload | null) => {
    if (!payload) {
      return;
    }

    if (!isAuthenticatedRef.current) {
      pendingNotificationRef.current = payload;
      return;
    }

    const navigated = navigateToChat({
      chatId: payload.chatId,
      chatName: payload.chatName,
      isGroup: payload.isGroup,
    });

    if (!navigated) {
      pendingNotificationRef.current = payload;
    } else {
      pendingNotificationRef.current = null;
    }
  }, []);

  // Initialize socket connection when authenticated
  useSocketConnection();
  
  // Initialize message notifications
  useMessageNotifications();

  // Register device push token with backend when authenticated
  usePushTokenRegistration();

  useEffect(() => {
    const unsubscribePress = notificationService.onNotificationPress((payload) => {
      handleNotificationNavigation(payload);
    });

    notificationService.getInitialNotification().then((payload) => {
      if (payload) {
        handleNotificationNavigation(payload);
      }
    });

    const removeReadyListener = addNavigationReadyListener(() => {
      if (pendingNotificationRef.current) {
        handleNotificationNavigation(pendingNotificationRef.current);
      }
    });

    return () => {
      unsubscribePress();
      removeReadyListener();
    };
  }, [handleNotificationNavigation]);

  useEffect(() => {
    isAuthenticatedRef.current = isAuthenticated;

    if (isAuthenticated && pendingNotificationRef.current) {
      handleNotificationNavigation(pendingNotificationRef.current);
    }
  }, [isAuthenticated, handleNotificationNavigation]);

  if (isRestoring) {
    const loadingBackgroundStyle = isDarkMode ? styles.loadingContainerDark : styles.loadingContainerLight;
    return (
      <View style={[styles.loadingContainer, loadingBackgroundStyle]}>
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

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainerDark: {
    backgroundColor: '#121212',
  },
  loadingContainerLight: {
    backgroundColor: '#FFFFFF',
  },
});
