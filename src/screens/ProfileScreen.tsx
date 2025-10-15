// src/screens/ProfileScreen.tsx

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { TextInput, Button, Text, Avatar, Divider } from 'react-native-paper';
import { useTheme } from '../theme/ThemeContext';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { RootState } from '../store';
import { updateUser } from '../store/authSlice';
import { useLogout } from '../hooks/useAuth';
import { clearAllData } from '../utils/storage';
import { updateProfileAPI, uploadAvatarAPI } from '../api/user';
import UserAvatar from '../components/UserAvatar';

const ProfileScreen: React.FC = () => {
  const { colors } = useTheme();
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const { user, refreshToken, deviceId } = useSelector((state: RootState) => state.auth);
  const logoutMutation = useLogout();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Name cannot be empty');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await updateProfileAPI({ name });
      
      // Update Redux store with response
      dispatch(updateUser({
        id: response.id,
        name: response.name,
        email: response.email,
        avatarUrl: response.avatarUrl,
        verified: response.verified,
      }));
      
      setSuccess('Profile updated successfully!');
      setIsEditing(false);

      console.log('Update profile:', { name, email });
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setName(user?.name || '');
    setEmail(user?.email || '');
    setError('');
    setSuccess('');
    setIsEditing(false);
  };

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
              if (refreshToken && deviceId) {
                await logoutMutation.mutateAsync({ refreshToken, deviceId });
              } else {
                // If no tokens, just clear local data
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

  const handleAvatarPress = async () => {
    if (!isEditing) return;

    try {
      // Import dynamically to avoid issues if not used
      const { pickImage, validateImage } = await import('../utils/imagePicker');
      
      // Pick image
      const image = await pickImage();
      if (!image) return;

      // Validate image
      const validation = validateImage(image);
      if (!validation.valid) {
        setError(validation.error || 'Invalid image');
        return;
      }

      setLoading(true);
      setError('');

      // Create FormData
      const formData = new FormData();
      formData.append('avatar', {
        uri: image.uri,
        type: image.type,
        name: image.name,
      } as any);
      
      // Upload avatar using FormData directly
      const response = await uploadAvatarAPI(formData);
      
      // Update Redux store with response
      dispatch(updateUser({
        id: response.id,
        name: response.name,
        email: response.email,
        avatarUrl: response.avatarUrl,
        verified: response.verified,
      }));
      
      setSuccess('Avatar updated successfully!');

      console.log('Avatar upload:', image);
    } catch (err: any) {
      setError(err.message || 'Failed to upload avatar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <Text variant="headlineMedium" style={[styles.title, { color: colors.text }]}>
          Profile
        </Text>
      </View>

      <View style={styles.avatarContainer}>
        <TouchableOpacity onPress={handleAvatarPress} disabled={!isEditing}>
          <UserAvatar
            size={100}
            avatarUrl={user?.avatarUrl}
            name={user?.name}
            style={styles.avatar}
          />
        </TouchableOpacity>
        {isEditing && (
          <Text variant="bodySmall" style={[styles.avatarHint, { color: colors.text }]}>
            Tap to change avatar
          </Text>
        )}
      </View>

      <Divider style={styles.divider} />

      <View style={styles.form}>
        <TextInput
          label="Full Name"
          value={name}
          onChangeText={(text) => {
            setName(text);
            setError('');
            setSuccess('');
          }}
          mode="outlined"
          disabled={!isEditing || loading}
          style={styles.input}
        />

        <TextInput
          label="Email"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            setError('');
            setSuccess('');
          }}
          mode="outlined"
          keyboardType="email-address"
          autoCapitalize="none"
          disabled={!isEditing || loading}
          style={styles.input}
        />

        {user?.verified !== undefined && (
          <View style={styles.verificationBadge}>
            <Text
              variant="bodyMedium"
              style={{
                color: user.verified ? '#4CAF50' : '#FF9800',
              }}
            >
              {user.verified ? '✓ Email Verified' : '⚠ Email Not Verified'}
            </Text>
          </View>
        )}

        {error ? (
          <Text variant="bodyMedium" style={styles.errorText}>
            {error}
          </Text>
        ) : null}

        {success ? (
          <Text variant="bodyMedium" style={styles.successText}>
            {success}
          </Text>
        ) : null}

        {isEditing ? (
          <View style={styles.buttonRow}>
            <Button
              mode="outlined"
              onPress={handleCancel}
              disabled={loading}
              style={styles.buttonHalf}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleSave}
              loading={loading}
              disabled={loading}
              style={styles.buttonHalf}
            >
              Save
            </Button>
          </View>
        ) : (
          <Button
            mode="contained"
            onPress={() => setIsEditing(true)}
            style={styles.button}
          >
            Edit Profile
          </Button>
        )}
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
  );
};

const styles = StyleSheet.create({
  avatar: {
    width: 100,
    height: 100,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontWeight: 'bold',
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarHint: {
    marginTop: 8,
    opacity: 0.7,
  },
  divider: {
    marginVertical: 24,
  },
  form: {
    marginBottom: 24,
  },
  input: {
    marginBottom: 16,
  },
  verificationBadge: {
    marginBottom: 16,
  },
  errorText: {
    color: '#F44336',
    marginBottom: 16,
  },
  successText: {
    color: '#4CAF50',
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
    paddingVertical: 6,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  buttonHalf: {
    flex: 1,
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
