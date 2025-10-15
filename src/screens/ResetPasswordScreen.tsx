// src/screens/ResetPasswordScreen.tsx

import React, { useState, useRef } from 'react';
import { View, StyleSheet, ScrollView, Alert, TextInput as RNTextInput } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { useTheme } from '../theme/ThemeContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useResetPassword } from '../hooks/useAuth';

interface RouteParams {
  email?: string;
}

const ResetPasswordScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { email } = (route.params as RouteParams) || {};
  const resetPasswordMutation = useResetPassword();
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({
    otp: '',
    password: '',
    confirmPassword: '',
  });

  const inputRefs = useRef<Array<RNTextInput | null>>([]);

  const handleOtpChange = (value: string, index: number) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setErrors({ ...errors, otp: '' });

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const validateForm = (): boolean => {
    const newErrors = {
      otp: '',
      password: '',
      confirmPassword: '',
    };

    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      newErrors.otp = 'Please enter the 6-digit code';
    }

    if (!newPassword) {
      newErrors.password = 'Password is required';
    } else if (newPassword.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return !newErrors.otp && !newErrors.password && !newErrors.confirmPassword;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !email) return;

    const otpCode = otp.join('');

    try {
      await resetPasswordMutation.mutateAsync({
        email,
        otp: otpCode,
        newPassword,
      });
      
      Alert.alert(
        'Success',
        'Your password has been reset successfully. Please login with your new password.',
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.navigate('Login' as never);
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert(
        'Error',
        error?.response?.data?.error || 'Failed to reset password. Please check your code and try again.'
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
          Reset Password
        </Text>
        <Text variant="bodyLarge" style={[styles.subtitle, { color: colors.text }]}>
          Enter the code sent to {email || 'your email'} and your new password.
        </Text>
      </View>

      <View style={styles.form}>
        <Text variant="bodyMedium" style={[styles.label, { color: colors.text }]}>
          Verification Code
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
              error={!!errors.otp}
              disabled={resetPasswordMutation.isPending}
              autoFocus={index === 0}
            />
          ))}
        </View>
        {errors.otp ? (
          <Text variant="bodySmall" style={styles.errorText}>
            {errors.otp}
          </Text>
        ) : null}

        <TextInput
          label="New Password"
          value={newPassword}
          onChangeText={(text) => {
            setNewPassword(text);
            setErrors({ ...errors, password: '' });
          }}
          mode="outlined"
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          error={!!errors.password}
          disabled={resetPasswordMutation.isPending}
          right={
            <TextInput.Icon
              icon={showPassword ? 'eye-off' : 'eye'}
              onPress={() => setShowPassword(!showPassword)}
            />
          }
          style={styles.input}
        />
        {errors.password ? (
          <Text variant="bodySmall" style={styles.errorText}>
            {errors.password}
          </Text>
        ) : null}

        <TextInput
          label="Confirm Password"
          value={confirmPassword}
          onChangeText={(text) => {
            setConfirmPassword(text);
            setErrors({ ...errors, confirmPassword: '' });
          }}
          mode="outlined"
          secureTextEntry={!showConfirmPassword}
          autoCapitalize="none"
          error={!!errors.confirmPassword}
          disabled={resetPasswordMutation.isPending}
          right={
            <TextInput.Icon
              icon={showConfirmPassword ? 'eye-off' : 'eye'}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            />
          }
          style={styles.input}
        />
        {errors.confirmPassword ? (
          <Text variant="bodySmall" style={styles.errorText}>
            {errors.confirmPassword}
          </Text>
        ) : null}

        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={resetPasswordMutation.isPending}
          disabled={resetPasswordMutation.isPending}
          style={styles.button}
        >
          Reset Password
        </Button>

        <Button
          mode="text"
          onPress={() => navigation.goBack()}
          disabled={resetPasswordMutation.isPending}
          style={styles.backButton}
        >
          Back
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
  label: {
    marginBottom: 8,
    fontWeight: '500',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  otpInput: {
    width: 48,
    height: 56,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
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

export default ResetPasswordScreen;
