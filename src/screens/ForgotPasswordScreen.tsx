// src/screens/ForgotPasswordScreen.tsx

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { useTheme } from '../theme/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { useForgotPassword } from '../hooks/useAuth';

const ForgotPasswordScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const forgotPasswordMutation = useForgotPassword();
  
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError('Email is required');
      return false;
    }
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email');
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleSubmit = async () => {
    if (!validateEmail(email)) return;

    try {
      await forgotPasswordMutation.mutateAsync({ email });
      
      Alert.alert(
        'Success',
        'If the email exists, a password reset code has been sent.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate to reset password screen
              navigation.navigate('ResetPassword' as never, { email } as never);
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert(
        'Error',
        error?.response?.data?.error || 'Failed to send reset code. Please try again.'
      );
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <Text variant="headlineMedium" style={[styles.title, { color: colors.text }]}>
          Forgot Password?
        </Text>
        <Text variant="bodyLarge" style={[styles.subtitle, { color: colors.text }]}>
          Enter your email address and we'll send you a code to reset your password.
        </Text>
      </View>

      <View style={styles.form}>
        <TextInput
          label="Email"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            setEmailError('');
          }}
          mode="outlined"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          error={!!emailError}
          disabled={forgotPasswordMutation.isPending}
          style={styles.input}
        />
        {emailError ? (
          <Text variant="bodySmall" style={styles.errorText}>
            {emailError}
          </Text>
        ) : null}

        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={forgotPasswordMutation.isPending}
          disabled={forgotPasswordMutation.isPending || !email}
          style={styles.button}
        >
          Send Reset Code
        </Button>

        <Button
          mode="text"
          onPress={() => navigation.goBack()}
          disabled={forgotPasswordMutation.isPending}
          style={styles.backButton}
        >
          Back to Login
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    marginBottom: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    opacity: 0.8,
    lineHeight: 24,
  },
  form: {
    width: '100%',
  },
  input: {
    marginBottom: 8,
  },
  errorText: {
    color: '#F44336',
    marginBottom: 16,
  },
  button: {
    marginTop: 16,
    paddingVertical: 6,
  },
  backButton: {
    marginTop: 16,
  },
});

export default ForgotPasswordScreen;
