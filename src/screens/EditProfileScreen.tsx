// src/screens/EditProfileScreen.tsx

import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { TextInput, Button, Text, Divider } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import { useTheme } from '../theme/ThemeContext';
import { RootState } from '../store';
import { updateUser } from '../store/authSlice';
import { updateProfileAPI } from '../api/user';
import UserAvatar from '../components/UserAvatar';
import { ensureAbsoluteUrl } from '../utils/url';

type ValidationResult = {
  valid: boolean;
  error?: string;
};

const EditProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { colors } = useTheme();
  const user = useSelector((state: RootState) => state.auth.user);

  const [name, setName] = useState(user?.name ?? '');
  const [email] = useState(user?.email ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | undefined>();
  const [avatarPath, setAvatarPath] = useState<string | undefined>();
  const [initialAvatarPath, setInitialAvatarPath] = useState<string | undefined>();
  const [avatarUploading, setAvatarUploading] = useState(false);

  useEffect(() => {
    const currentAvatar = user?.avatarUrl ?? undefined;
    setAvatarUri(currentAvatar ? ensureAbsoluteUrl(currentAvatar) : undefined);
    setAvatarPath(currentAvatar);
    setInitialAvatarPath(currentAvatar);
  }, [user]);

  const hasNameChanged = useMemo(
    () => name.trim() !== (user?.name ?? ''),
    [name, user?.name],
  );

  const hasAvatarChanged = useMemo(
    () => avatarPath !== initialAvatarPath,
    [avatarPath, initialAvatarPath],
  );

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Name cannot be empty');
      return;
    }

    if (!hasNameChanged && !hasAvatarChanged) {
      setSuccess('No changes to save');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const payload: { name?: string; avatarUrl?: string | null } = {};

      if (hasNameChanged) {
        payload.name = name.trim();
      }

      if (hasAvatarChanged) {
        payload.avatarUrl = avatarPath ?? null;
      }

      const response = await updateProfileAPI(payload);

      dispatch(updateUser({
        id: response.id,
        name: response.name,
        email: response.email,
        avatarUrl: response.avatarUrl,
        verified: response.verified,
      }));

      setSuccess('Profile updated successfully!');
      setInitialAvatarPath(response.avatarUrl ?? undefined);
      setAvatarPath(response.avatarUrl ?? undefined);
      setAvatarUri(response.avatarUrl ? ensureAbsoluteUrl(response.avatarUrl) : undefined);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarPress = async () => {
    try {
      const { pickImage, validateImage } = await import('../utils/imagePicker');

      const image = await pickImage();
      if (!image) return;

      const validation: ValidationResult = validateImage(image);
      if (!validation.valid) {
        setError(validation.error || 'Invalid image');
        return;
      }

      setAvatarUploading(true);
      setError('');
      setSuccess('');

      const { uploadFileToBackend } = await import('../utils/attachmentUpload');

      const { absoluteUrl, relativePath } = await uploadFileToBackend(
        image.uri,
        image.name,
        image.type
      );

      setAvatarUri(absoluteUrl);
      setAvatarPath(relativePath);
      Alert.alert('Avatar Ready', 'Photo uploaded. Remember to save your changes.');
    } catch (err: any) {
      setError(err.message || 'Failed to upload avatar');
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleCancel = () => {
    setName(user?.name ?? '');
    const currentAvatar = initialAvatarPath;
    setAvatarUri(currentAvatar ? ensureAbsoluteUrl(currentAvatar) : undefined);
    setAvatarPath(currentAvatar);
    setError('');
    setSuccess('');
    navigation.goBack();
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.avatarSection}>
        <TouchableOpacity onPress={handleAvatarPress} disabled={loading || avatarUploading}>
          <UserAvatar
            size={110}
            avatarUrl={avatarUri}
            name={user?.name}
            style={styles.avatar}
          />
        </TouchableOpacity>
        <Text variant="bodySmall" style={[styles.avatarHint, { color: colors.text }]}>
          Tap to change avatar
        </Text>
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
          disabled={loading}
          style={styles.input}
        />

        <TextInput
          label="Email"
          value={email}
          mode="outlined"
          disabled
          style={styles.input}
        />

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

        <View style={styles.buttonRow}>
          <Button
            mode="outlined"
            onPress={handleCancel}
            disabled={loading || avatarUploading}
            style={styles.buttonHalf}
          >
            Cancel
          </Button>
          <Button
            mode="contained"
            onPress={handleSave}
            loading={loading}
            disabled={loading || avatarUploading}
            style={styles.buttonHalf}
          >
            Save
          </Button>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontWeight: 'bold',
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    marginBottom: 8,
  },
  avatarHint: {
    fontStyle: 'italic',
  },
  divider: {
    marginVertical: 16,
  },
  form: {
    gap: 16,
  },
  input: {
    marginBottom: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  buttonHalf: {
    flex: 1,
  },
  errorText: {
    color: '#E53935',
  },
  successText: {
    color: '#4CAF50',
  },
});

export default EditProfileScreen;
