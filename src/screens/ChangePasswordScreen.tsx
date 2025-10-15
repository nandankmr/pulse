// src/screens/ChangePasswordScreen.tsx

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Button, Text, TextInput, Appbar } from 'react-native-paper';
import { useTheme } from '../theme/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { useChangePassword } from '../hooks/useAuth';

const ChangePasswordScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const changePasswordMutation = useChangePassword();
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const validateForm = (): boolean => {
    const newErrors = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    };

    if (!currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }

    if (!newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    } else if (newPassword === currentPassword) {
      newErrors.newPassword = 'New password must be different from current password';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return !newErrors.currentPassword && !newErrors.newPassword && !newErrors.confirmPassword;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      await changePasswordMutation.mutateAsync({
        currentPassword,
        newPassword,
      });
      
      Alert.alert(
        'Success',
        'Your password has been changed successfully.',
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.goBack();
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert(
        'Error',
        error?.response?.data?.error || 'Failed to change password. Please check your current password and try again.'
      );
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Change Password" />
      </Appbar.Header>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text variant="bodyLarge" style={[styles.subtitle, { color: colors.text }]}>
          Enter your current password and choose a new password.
        </Text>

        <View style={styles.form}>
          <TextInput
            label="Current Password"
            value={currentPassword}
            onChangeText={(text) => {
              setCurrentPassword(text);
              setErrors({ ...errors, currentPassword: '' });
            }}
            mode="outlined"
            secureTextEntry={!showCurrentPassword}
            autoCapitalize="none"
            error={!!errors.currentPassword}
            disabled={changePasswordMutation.isPending}
            right={
              <TextInput.Icon
                icon={showCurrentPassword ? 'eye-off' : 'eye'}
                onPress={() => setShowCurrentPassword(!showCurrentPassword)}
              />
            }
            style={styles.input}
          />
          {errors.currentPassword ? (
            <Text variant="bodySmall" style={styles.errorText}>
              {errors.currentPassword}
            </Text>
          ) : null}

          <TextInput
            label="New Password"
            value={newPassword}
            onChangeText={(text) => {
              setNewPassword(text);
              setErrors({ ...errors, newPassword: '' });
            }}
            mode="outlined"
            secureTextEntry={!showNewPassword}
            autoCapitalize="none"
            error={!!errors.newPassword}
            disabled={changePasswordMutation.isPending}
            right={
              <TextInput.Icon
                icon={showNewPassword ? 'eye-off' : 'eye'}
                onPress={() => setShowNewPassword(!showNewPassword)}
              />
            }
            style={styles.input}
          />
          {errors.newPassword ? (
            <Text variant="bodySmall" style={styles.errorText}>
              {errors.newPassword}
            </Text>
          ) : null}

          <TextInput
            label="Confirm New Password"
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              setErrors({ ...errors, confirmPassword: '' });
            }}
            mode="outlined"
            secureTextEntry={!showConfirmPassword}
            autoCapitalize="none"
            error={!!errors.confirmPassword}
            disabled={changePasswordMutation.isPending}
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

          <Text variant="bodySmall" style={[styles.hint, { color: colors.text }]}>
            Password must be at least 8 characters long
          </Text>

          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={changePasswordMutation.isPending}
            disabled={changePasswordMutation.isPending}
            style={styles.button}
          >
            Change Password
          </Button>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: 24,
  },
  subtitle: {
    marginBottom: 24,
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
  hint: {
    marginBottom: 24,
    opacity: 0.6,
  },
  button: {
    paddingVertical: 6,
  },
});

export default ChangePasswordScreen;
