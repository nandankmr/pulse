// src/screens/RegisterScreen.tsx

import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { TextInput, Button, Text, HelperText } from 'react-native-paper';
import { useTheme } from '../theme/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { useRegister } from '../hooks/useAuth';
import { isApiError } from '../types/api';
import config from '../config';

const RegisterScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const registerMutation = useRegister();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  };

  const validatePassword = (value: string) => {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    return value.length >= 8;
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (!validatePassword(password)) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      await registerMutation.mutateAsync({ name, email, password });

      if (config.USE_FIREBASE_AUTH) {
        Alert.alert(
          'Verify your email',
          'We\'ve sent a verification link to your email. Open the link to verify your account, then sign in here.'
        );
        navigation.navigate('Login' as never);
        return;
      }

      // Legacy auth: navigate to OTP verification flow
      (navigation as any).navigate('EmailVerification', { email });
    } catch (err) {
      const errorMessage = isApiError(err) 
        ? err.message 
        : 'Registration failed. Please try again.';
      setErrors({ general: errorMessage });
    }
  };

  const navigateToLogin = () => {
    navigation.navigate('Login' as never);
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
            Create Account
          </Text>
          <Text variant="bodyMedium" style={[styles.subtitle, { color: colors.text }]}>
            Sign up to get started
          </Text>

          <TextInput
            label="Full Name"
            value={name}
            onChangeText={(text) => {
              setName(text);
              if (errors.name) {
                setErrors({ ...errors, name: '' });
              }
            }}
            mode="outlined"
            autoCapitalize="words"
            autoComplete="name"
            style={styles.input}
            error={!!errors.name}
          />
          {errors.name ? (
            <HelperText type="error" visible={!!errors.name} style={styles.errorText}>
              {errors.name}
            </HelperText>
          ) : null}

          <TextInput
            label="Email"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (errors.email) {
                setErrors({ ...errors, email: '' });
              }
            }}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            style={styles.input}
            error={!!errors.email}
          />
          {errors.email ? (
            <HelperText type="error" visible={!!errors.email} style={styles.errorText}>
              {errors.email}
            </HelperText>
          ) : null}

          <TextInput
            label="Password"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (errors.password) {
                setErrors({ ...errors, password: '' });
              }
            }}
            mode="outlined"
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoComplete="password-new"
            style={styles.input}
            error={!!errors.password}
            right={
              <TextInput.Icon
                icon={showPassword ? 'eye-off' : 'eye'}
                onPress={() => setShowPassword(!showPassword)}
              />
            }
          />
          {errors.password ? (
            <HelperText type="error" visible={!!errors.password} style={styles.errorText}>
              {errors.password}
            </HelperText>
          ) : null}

          <TextInput
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              if (errors.confirmPassword) {
                setErrors({ ...errors, confirmPassword: '' });
              }
            }}
            mode="outlined"
            secureTextEntry={!showConfirmPassword}
            autoCapitalize="none"
            autoComplete="password-new"
            style={styles.input}
            error={!!errors.confirmPassword}
            right={
              <TextInput.Icon
                icon={showConfirmPassword ? 'eye-off' : 'eye'}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              />
            }
          />
          {errors.confirmPassword ? (
            <HelperText type="error" visible={!!errors.confirmPassword} style={styles.errorText}>
              {errors.confirmPassword}
            </HelperText>
          ) : null}

          {errors.general ? (
            <HelperText type="error" visible={!!errors.general} style={styles.generalError}>
              {errors.general}
            </HelperText>
          ) : null}

          <Button
            mode="contained"
            onPress={handleRegister}
            loading={registerMutation.isPending}
            disabled={registerMutation.isPending}
            style={styles.button}
          >
            Create Account
          </Button>

          <View style={styles.loginContainer}>
            <Text variant="bodyMedium" style={{ color: colors.text }}>
              Already have an account?{' '}
            </Text>
            <Button
              mode="text"
              onPress={navigateToLogin}
              disabled={registerMutation.isPending}
              compact
            >
              Sign In
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
    marginBottom: 8,
  },
  button: {
    marginTop: 16,
    paddingVertical: 6,
  },
  errorText: {
    marginTop: -4,
    marginBottom: 8,
  },
  generalError: {
    marginTop: 8,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
});

export default RegisterScreen;
