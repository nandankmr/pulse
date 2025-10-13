// src/screens/ProfileScreen.tsx

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { TextInput, Button, Text, Avatar, Divider } from 'react-native-paper';
import { useTheme } from '../theme/ThemeContext';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { updateUser, logout } from '../store/authSlice';

const ProfileScreen: React.FC = () => {
  const { colors } = useTheme();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);

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
      // TODO: Replace with actual API call
      // const response = await updateProfileAPI({ name, email });
      // dispatch(updateUser(response.user));

      // Mock delay for demonstration
      await new Promise<void>((resolve) => setTimeout(() => resolve(), 1000));

      // Update local state
      dispatch(updateUser({ name, email }));
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

  const handleLogout = () => {
    dispatch(logout());
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

      // TODO: Replace with actual API calls
      // 1. Get presigned URL
      // const { presignedUrl, url } = await getAvatarUploadUrlAPI(
      //   image.name,
      //   image.type
      // );
      
      // 2. Upload to S3
      // const blob = await fetch(image.uri).then(r => r.blob());
      // await uploadAvatarToS3(presignedUrl, blob, image.type);
      
      // 3. Confirm upload and update profile
      // const response = await confirmAvatarUploadAPI(url);
      // dispatch(updateUser(response.user));

      // Mock delay for demonstration
      await new Promise<void>((resolve) => setTimeout(() => resolve(), 1500));

      // Update local state with mock URL
      dispatch(updateUser({ avatar: image.uri }));
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
          {user?.avatar ? (
            <Avatar.Image size={120} source={{ uri: user.avatar }} />
          ) : (
            <Avatar.Text
              size={120}
              label={user?.name?.substring(0, 2).toUpperCase() || 'U'}
            />
          )}
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

        {user?.isEmailVerified !== undefined && (
          <View style={styles.verificationBadge}>
            <Text
              variant="bodyMedium"
              style={{
                color: user.isEmailVerified ? '#4CAF50' : '#FF9800',
              }}
            >
              {user.isEmailVerified ? '✓ Email Verified' : '⚠ Email Not Verified'}
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

      <View style={styles.dangerZone}>
        <Button
          mode="outlined"
          onPress={handleLogout}
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
  dangerZone: {
    marginTop: 24,
  },
  logoutButton: {
    borderColor: '#F44336',
    paddingVertical: 6,
  },
});

export default ProfileScreen;
