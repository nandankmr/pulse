// src/screens/EmailVerificationScreen.tsx

import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TextInput as RNTextInput } from 'react-native';
import { Button, Text, ActivityIndicator, TextInput } from 'react-native-paper';
import { useTheme } from '../theme/ThemeContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useVerifyEmail, useResendVerification } from '../hooks/useAuth';
import { isApiError } from '../types/api';

interface RouteParams {
  email?: string;
}

const EmailVerificationScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { email } = (route.params as RouteParams) || {};
  const verifyMutation = useVerifyEmail();
  const resendMutation = useResendVerification();
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isVerified, setIsVerified] = useState(false);
  const [message, setMessage] = useState('');
  const [canResend, setCanResend] = useState(true);
  const [countdown, setCountdown] = useState(0);

  const inputRefs = useRef<Array<RNTextInput | null>>([]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleOtpChange = (value: string, index: number) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits are entered
    if (index === 5 && value) {
      const otpCode = [...newOtp.slice(0, 5), value].join('');
      if (otpCode.length === 6) {
        handleVerifyOtp(otpCode);
      }
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async (otpCode?: string) => {
    const code = otpCode || otp.join('');
    
    if (code.length !== 6 || !email) {
      return;
    }

    try {
      await verifyMutation.mutateAsync({ email, otp: code });
      setIsVerified(true);
      
      // Navigate to login after showing success message
      setTimeout(() => {
        navigation.navigate('Login' as never);
      }, 2000);
    } catch (err) {
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  };

  const handleResendCode = async () => {
    if (!canResend || !email) return;

    try {
      await resendMutation.mutateAsync({ email });
      setMessage('Verification code sent! Check your email.');
      setCanResend(false);
      setCountdown(60); // 60 second countdown
      
      // Clear message after 5 seconds
      setTimeout(() => setMessage(''), 5000);
    } catch (error: any) {
      setMessage(error?.response?.data?.error || 'Failed to send code. Please try again.');
    }
  };

  const navigateToLogin = () => {
    navigation.navigate('Login' as never);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        {isVerified ? (
          <>
            <Text variant="headlineMedium" style={[styles.title, { color: colors.text }]}>
              ✅ Email Verified!
            </Text>
            <Text variant="bodyLarge" style={[styles.successMessage, { color: colors.text }]}>
              Your email has been successfully verified. Redirecting to login...
            </Text>
            <ActivityIndicator size="large" style={styles.loader} />
          </>
        ) : (
          <>
            <Text variant="headlineMedium" style={[styles.title, { color: colors.text }]}>
              Verify Your Email
            </Text>
            
            <Text variant="bodyLarge" style={[styles.subtitle, { color: colors.text }]}>
              We've sent a 6-digit code to:
            </Text>
            
            <Text variant="bodyLarge" style={[styles.email, { color: colors.text }]}>
              {email || 'your email address'}
            </Text>
            
            <Text variant="bodyMedium" style={[styles.instructions, { color: colors.text }]}>
              Enter the code below to verify your account
            </Text>

            <View style={styles.otpContainer}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref: any) => {
                    inputRefs.current[index] = ref;
                  }}
                  mode="outlined"
                  value={digit}
                  onChangeText={(value) => handleOtpChange(value, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                  style={styles.otpInput}
                  error={verifyMutation.isError}
                  disabled={verifyMutation.isPending}
                  autoFocus={index === 0}
                />
              ))}
            </View>

            {verifyMutation.isError ? (
              <Text variant="bodyMedium" style={styles.errorText}>
                {isApiError(verifyMutation.error) 
                  ? verifyMutation.error.message 
                  : 'Invalid verification code'}
              </Text>
            ) : null}

            {message ? (
              <Text variant="bodyMedium" style={styles.successText}>
                {message}
              </Text>
            ) : null}

            <Button
              mode="contained"
              onPress={() => handleVerifyOtp()}
              loading={verifyMutation.isPending}
              disabled={verifyMutation.isPending || otp.join('').length !== 6}
              style={styles.button}
            >
              Verify Code
            </Button>

            <View style={styles.resendContainer}>
              <Text variant="bodyMedium" style={{ color: colors.text }}>
                Didn't receive the code?
              </Text>
              <Button
                mode="text"
                onPress={handleResendCode}
                disabled={!canResend || verifyMutation.isPending || resendMutation.isPending}
                loading={resendMutation.isPending}
                compact
              >
                {countdown > 0 ? `Resend (${countdown}s)` : 'Resend Code'}
              </Button>
            </View>

            <Button
              mode="outlined"
              onPress={navigateToLogin}
              disabled={verifyMutation.isPending}
              style={styles.backButton}
            >
              Back to Login
            </Button>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  content: {
    padding: 24,
    alignItems: 'center',
  },
  title: {
    marginBottom: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    marginBottom: 8,
    textAlign: 'center',
    opacity: 0.8,
  },
  email: {
    marginBottom: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  instructions: {
    marginBottom: 24,
    textAlign: 'center',
    opacity: 0.7,
    lineHeight: 22,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  otpInput: {
    width: 48,
    height: 56,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  errorText: {
    color: '#F44336',
    marginBottom: 16,
    textAlign: 'center',
  },
  successText: {
    color: '#4CAF50',
    marginBottom: 16,
    textAlign: 'center',
  },
  successMessage: {
    marginBottom: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  button: {
    width: '100%',
    marginTop: 8,
    paddingVertical: 6,
  },
  resendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 4,
  },
  backButton: {
    width: '100%',
    marginTop: 16,
    paddingVertical: 6,
  },
  loader: {
    marginTop: 16,
  },
});

export default EmailVerificationScreen;
