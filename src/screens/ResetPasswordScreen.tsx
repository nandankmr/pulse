// src/screens/ResetPasswordScreen.tsx

import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { useTheme } from '../theme/ThemeContext';
import { layout } from '../theme';
import { useNavigation } from '@react-navigation/native';

const ResetPasswordScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();

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
          We emailed you a password reset link. Open the link to set a new password, then return here to sign in.
        </Text>
      </View>

      <View style={styles.form}>
        <Button
          mode="contained"
          onPress={() => navigation.navigate('Login')}
          style={styles.button}
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
    paddingHorizontal: layout.screen.paddingHorizontal,
    paddingVertical: layout.screen.paddingVertical,
  },
  header: {
    marginBottom: layout.screen.paddingVertical,
    alignItems: 'center',
    paddingHorizontal: layout.header.paddingHorizontal,
    paddingVertical: layout.header.paddingVertical,
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
