// src/screens/UserDetailsScreen.tsx

import React, { useEffect, useLayoutEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { Text, Divider, Button, ActivityIndicator } from 'react-native-paper';
import { useTheme } from '../theme/ThemeContext';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import apiClient from '../api/client';
import UserAvatar from '../components/UserAvatar';
import { createChatAPI } from '../api/chat';

type UserDetailsScreenRouteProp = RouteProp<RootStackParamList, 'UserDetails'>;
type UserDetailsScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'UserDetails'
>;

interface UserDetails {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
}

const UserDetailsScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<UserDetailsScreenNavigationProp>();
  const route = useRoute<UserDetailsScreenRouteProp>();
  const { userId } = route.params;
  const currentUser = useSelector((state: RootState) => state.auth.user);

  const [user, setUser] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: user?.name ?? 'User Details',
      headerBackTitle: 'Back',
    });
  }, [navigation, user?.name]);

  useEffect(() => {
    fetchUserDetails();
  }, [userId]);

  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await apiClient.get<UserDetails>(`/users/${userId}`);
      setUser(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load user details');
      console.error('Error fetching user details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartChat = async () => {
    try {
      setLoading(true);
      // Create or get existing conversation
      const response = await createChatAPI({ recipientId: userId });
      
      // Navigate to the chat
      navigation.navigate('Chat', { 
        chatId: response.chat.id, 
        chatName: response.chat.name
      });
    } catch (err: any) {
      console.error('Error starting chat:', err);
      Alert.alert('Error', err.response?.data?.message || 'Failed to start chat');
    } finally {
      setLoading(false);
    }
  };

  const handleBlock = () => {
    Alert.alert(
      'Block User',
      `Are you sure you want to block ${user?.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement block functionality
            Alert.alert('Feature Coming Soon', 'Block functionality will be implemented soon.');
          },
        },
      ]
    );
  };

  const handleReport = () => {
    Alert.alert(
      'Report User',
      `Report ${user?.name} for inappropriate behavior?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Report',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement report functionality
            Alert.alert('Feature Coming Soon', 'Report functionality will be implemented soon.');
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error || !user) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.error, marginBottom: 16 }}>{error || 'User not found'}</Text>
        <Button mode="contained" onPress={fetchUserDetails}>
          Retry
        </Button>
      </View>
    );
  }

  const isCurrentUser = currentUser?.id === user.id;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Avatar and Name */}
      <View style={styles.profileSection}>
        <UserAvatar
          size={120}
          avatarUrl={user.avatarUrl}
          name={user.name}
        />
        <Text variant="headlineMedium" style={[styles.name, { color: colors.text }]}>
          {user.name}
        </Text>
        {user.verified && (
          <View style={styles.verifiedBadge}>
            <Text style={{ color: '#4CAF50' }}>✓ Verified</Text>
          </View>
        )}
      </View>

      <Divider style={styles.divider} />

      {/* User Information */}
      <View style={styles.infoSection}>
        <Text variant="titleMedium" style={[styles.sectionTitle, { color: colors.text }]}>
          Information
        </Text>

        <View style={styles.infoRow}>
          <Text style={{ color: colors.text, opacity: 0.7 }}>Email</Text>
          <Text style={{ color: colors.text }}>{user.email}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={{ color: colors.text, opacity: 0.7 }}>Member Since</Text>
          <Text style={{ color: colors.text }}>
            {new Date(user.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>

      <Divider style={styles.divider} />

      {/* Actions */}
      {!isCurrentUser && (
        <View style={styles.actionsSection}>
          <Button
            mode="contained"
            icon="message"
            onPress={handleStartChat}
            style={styles.actionButton}
          >
            Send Message
          </Button>
{/* 
          <Button
            mode="outlined"
            icon="block-helper"
            onPress={handleBlock}
            style={styles.actionButton}
            textColor={colors.error}
          >
            Block User
          </Button>

          <Button
            mode="text"
            icon="flag"
            onPress={handleReport}
            style={styles.actionButton}
            textColor={colors.error}
          >
            Report User
          </Button> */}
        </View>
      )}

      {isCurrentUser && (
        <View style={styles.actionsSection}>
          <Text style={{ color: colors.text, textAlign: 'center', opacity: 0.7 }}>
            This is your profile
          </Text>
          <Button
            mode="contained"
            icon="account-edit"
            onPress={() => navigation.navigate('Profile')}
            style={styles.actionButton}
          >
            Edit Profile
          </Button>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    // paddingBottom: 32,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  name: {
    marginTop: 16,
    fontWeight: 'bold',
  },
  verifiedBadge: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  divider: {
    marginVertical: 16,
  },
  infoSection: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    marginBottom: 16,
    fontWeight: 'bold',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  actionsSection: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  actionButton: {
    marginVertical: 8,
  },
});

export default UserDetailsScreen;
