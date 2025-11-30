// src/screens/ProfileScreen.tsx

import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Button, Text, Divider } from 'react-native-paper';
import { useTheme } from '../theme/ThemeContext';
import { layout } from '../theme';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { RootState } from '../store';
import { useLogout } from '../hooks/useAuth';
import { clearAllData } from '../utils/storage';
import UserAvatar from '../components/UserAvatar';
import { SafeAreaView } from 'react-native-safe-area-context';

const ProfileScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const { user, refreshToken, deviceId, provider } = useSelector((state: RootState) => state.auth);
  const logoutMutation = useLogout();

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              if (provider === 'firebase') {
                await logoutMutation.mutateAsync(undefined);
              } else if (refreshToken && deviceId) {
                await logoutMutation.mutateAsync({ refreshToken, deviceId });
              } else {
                await clearAllData();
              }
            } catch (error) {
              // Even if backend call fails, clear local data
              console.error('Logout error:', error);
              await clearAllData();
            }
          },
        },
      ]
    );
  };

  const handleChangePassword = () => {
    navigation.navigate('ChangePassword' as never);
  };

  const handleEditProfile = () => {
    navigation.navigate('EditProfile' as never);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.content}
      >
      {/* <View style={styles.branding}>
        <AgastyaChatIcon width={72} height={72} />
        <Text variant="titleLarge" style={[styles.brandingText, { color: colors.text }]}>Agastya</Text>
      </View> */}

      <View style={styles.header}>
        <Text variant="headlineMedium" style={[styles.title, { color: colors.text }]}>
          Profile
        </Text>
      </View>

      <View style={styles.avatarContainer}>
        <TouchableOpacity onPress={handleEditProfile}>
          <UserAvatar
            size={100}
            avatarUrl={user?.avatarUrl}
            name={user?.name}
            style={styles.avatar}
          />
        </TouchableOpacity>
        <Text variant="bodySmall" style={[styles.avatarHint, { color: colors.text }]}>Tap to edit profile</Text>
      </View>

      <Divider style={styles.divider} />

      <View style={styles.summary}>
        <View style={styles.summaryRow}>
          <Text variant="bodyMedium" style={[styles.summaryLabel, styles.summaryLabelText]}>
            Name
          </Text>
          <Text variant="bodyLarge" style={[styles.summaryValue, { color: colors.text }]}>
            {user?.name ?? '—'}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text variant="bodyMedium" style={[styles.summaryLabel, styles.summaryLabelText]}>
            Email
          </Text>
          <Text variant="bodyLarge" style={[styles.summaryValue, { color: colors.text }]}>
            {user?.email ?? '—'}
          </Text>
        </View>
        {user?.verified !== undefined && (
          <View style={styles.summaryRow}>
            <Text variant="bodyMedium" style={[styles.summaryLabel, styles.summaryLabelText]}>
              Status
            </Text>
            <Text variant="bodyLarge" style={[styles.statusText, user.verified ? styles.statusVerified : styles.statusUnverified]}>
              {user.verified ? 'Email Verified' : 'Email Not Verified'}
            </Text>
          </View>
        )}
        <Button mode="contained" onPress={handleEditProfile} style={styles.button}>
          Edit Profile
        </Button>
      </View>

      <Divider style={styles.divider} />

      <View style={styles.actions}>
        <Button
          mode="outlined"
          onPress={handleChangePassword}
          icon="lock"
          style={styles.actionButton}
        >
          Change Password
        </Button>
      </View>

      <Divider style={styles.divider} />

      <View style={styles.dangerZone}>
        <Button
          mode="outlined"
          onPress={handleLogout}
          loading={logoutMutation.isPending}
          disabled={logoutMutation.isPending}
          textColor="#F44336"
          style={styles.logoutButton}
        >
          Logout
        </Button>
      </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: layout.screen.paddingHorizontal,
    paddingVertical: layout.screen.paddingVertical,
  },
  header: {
    marginBottom: layout.screen.paddingVertical,
  },
  title: {
    fontWeight: 'bold',
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 100,
    height: 100,
  },
  avatarHint: {
    marginTop: 8,
    opacity: 0.7,
  },
  divider: {
    marginVertical: 24,
  },
  branding: {
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  brandingText: {
    fontWeight: '700',
    letterSpacing: 1,
  },
  summary: {
    marginBottom: 24,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    flex: 1,
  },
  summaryLabelText: {
    opacity: 0.7,
  },
  summaryValue: {
    flex: 1,
    textAlign: 'right',
    fontWeight: '600',
  },
  statusText: {
    fontWeight: '600',
  },
  statusVerified: {
    color: '#4CAF50',
  },
  statusUnverified: {
    color: '#FF9800',
  },
  button: {
    marginTop: 8,
    paddingVertical: 6,
  },
  actions: {
    marginTop: 8,
  },
  actionButton: {
    paddingVertical: 6,
    marginBottom: 12,
  },
  dangerZone: {
    marginTop: 24,
  },
  logoutButton: {
    borderColor: '#F44336',
    paddingVertical: 6,
  },
});

export default ProfileScreen;
