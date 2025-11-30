// src/screens/LoginScreen.tsx

import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { TextInput, Button, Text, HelperText } from 'react-native-paper';
import { useTheme } from '../theme/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { useLogin } from '../hooks/useAuth';
import { ApiError, isApiError } from '../types/api';

const LoginScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const loginMutation = useLogin();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const validateEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  };

  const handleLogin = async () => {
    if (!email || !password) {
      return;
    }

    if (!validateEmail(email)) {
      return;
    }

    try {
      await loginMutation.mutateAsync({ email, password });
      // Navigation will happen automatically after successful login
      // The user will be redirected to the home screen by the navigation logic
    } catch (err) {
      // Check if error is due to unverified email
      const apiError = err as ApiError;
      if (apiError?.data?.code === 'EMAIL_NOT_VERIFIED') {
        // Navigate to email verification screen with user's email
        (navigation as any).navigate('EmailVerification', { email: apiError.data.email });
      } else {
        // Other errors are handled by the mutation
        console.error('Login error:', err);
      }
    }
  };

  const navigateToRegister = () => {
    navigation.navigate('Register' as never);
  };

  const navigateToForgotPassword = () => {
    navigation.navigate('ForgotPassword' as never);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <Text variant="headlineLarge" style={[styles.title, { color: colors.text }]}>
            Welcome Back
          </Text>
          <Text variant="bodyMedium" style={[styles.subtitle, { color: colors.text }]}>
            Sign in to continue
          </Text>

          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            style={styles.input}
            error={loginMutation.isError && !validateEmail(email) && email.length > 0}
          />

          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            mode="outlined"
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoComplete="password"
            style={styles.input}
            right={
              <TextInput.Icon
                icon={showPassword ? 'eye-off' : 'eye'}
                onPress={() => setShowPassword(!showPassword)}
              />
            }
          />

          {loginMutation.isError ? (
            <HelperText type="error" visible={loginMutation.isError} style={styles.errorText}>
              {(() => {
                if (isApiError(loginMutation.error)) {
                  return loginMutation.error.message;
                }

                if (loginMutation.error instanceof Error && loginMutation.error.message) {
                  return loginMutation.error.message;
                }

                return 'Login failed. Please try again.';
              })()}
            </HelperText>
          ) : null}

          <Button
            mode="contained"
            onPress={handleLogin}
            loading={loginMutation.isPending}
            disabled={loginMutation.isPending}
            style={styles.button}
          >
            Sign In
          </Button>

          <Button
            mode="text"
            onPress={navigateToForgotPassword}
            disabled={loginMutation.isPending}
            style={styles.forgotButton}
          >
            Forgot Password?
          </Button>

          <View style={styles.registerContainer}>
            <Text variant="bodyMedium" style={{ color: colors.text }}>
              Don't have an account?{' '}
            </Text>
            <Button
              mode="text"
              onPress={navigateToRegister}
              disabled={loginMutation.isPending}
              compact
            >
              Sign Up
            </Button>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    padding: 24,
  },
  title: {
    marginBottom: 8,
    fontWeight: 'bold',
  },
  subtitle: {
    marginBottom: 32,
    opacity: 0.7,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
    paddingVertical: 6,
  },
  forgotButton: {
    marginTop: 8,
  },
  errorText: {
    marginTop: -8,
    marginBottom: 8,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
});

export default LoginScreen;
