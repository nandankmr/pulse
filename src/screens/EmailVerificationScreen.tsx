// src/screens/EmailVerificationScreen.tsx

import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TextInput as RNTextInput } from 'react-native';
import { Button, Text, ActivityIndicator, TextInput } from 'react-native-paper';
import { useTheme } from '../theme/ThemeContext';
import { useNavigation, useRoute } from '@react-navigation/native';

interface RouteParams {
  email?: string;
}

const EmailVerificationScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { email } = (route.params as RouteParams) || {};
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState('');
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
    setError('');

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
    
    if (code.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      // TODO: Replace with actual API call
      // const response = await verifyEmailOtpAPI({ email, otp: code });
      // dispatch(setAuth(response));
      // await saveAuthToken(response.token);
      // await saveUserData(response.user);
      
      // Mock delay for demonstration
      await new Promise<void>(resolve => setTimeout(() => resolve(), 1000));
      
      // Mock success
      setIsVerified(true);
      
      // Navigate to home after 1.5 seconds
      setTimeout(() => {
        // navigation.navigate('Home' as never);
      }, 1500);
      
      console.log('Verify OTP:', { email, code });
    } catch (err: any) {
      setError(err.message || 'Invalid verification code. Please try again.');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!canResend) return;

    setResendLoading(true);
    setMessage('');
    setError('');
    
    try {
      // TODO: Replace with actual API call
      // await resendVerificationOtpAPI({ email });
      
      // Mock delay for demonstration
      await new Promise<void>(resolve => setTimeout(() => resolve(), 1000));
      
      setMessage('Verification code sent! Please check your email.');
      setCanResend(false);
      setCountdown(60); // 60 second cooldown
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      
      console.log('Resend verification code to:', email);
    } catch (err: any) {
      setError(err.message || 'Failed to resend code. Please try again.');
    } finally {
      setResendLoading(false);
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
              Your email has been successfully verified. Logging you in...
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
                  error={!!error}
                  disabled={loading || resendLoading}
                  autoFocus={index === 0}
                />
              ))}
            </View>

            {error ? (
              <Text variant="bodyMedium" style={styles.errorText}>
                {error}
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
              loading={loading}
              disabled={loading || resendLoading || otp.join('').length !== 6}
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
                loading={resendLoading}
                disabled={!canResend || resendLoading || loading}
                compact
              >
                {countdown > 0 ? `Resend (${countdown}s)` : 'Resend Code'}
              </Button>
            </View>

            <Button
              mode="outlined"
              onPress={navigateToLogin}
              disabled={loading || resendLoading}
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
