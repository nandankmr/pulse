// src/screens/EditGroupScreen.tsx

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { TextInput, Button, Text, Appbar, Avatar } from 'react-native-paper';
import { useTheme } from '../theme/ThemeContext';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useGroup } from '../hooks/useGroups';
import { useUpdateGroupDetails } from '../hooks/useChatManagement';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface RouteParams {
  groupId: string;
}

const EditGroupScreen: React.FC = () => {
  const { colors } = useTheme();
  const route = useRoute();
  const navigation = useNavigation();
  const { groupId } = (route.params as RouteParams) || {};
  
  const { data: group, isLoading } = useGroup(groupId);
  const updateGroupMutation = useUpdateGroupDetails();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | undefined>();
  const [errors, setErrors] = useState({
    name: '',
    description: '',
  });

  // Initialize form when group data loads
  React.useEffect(() => {
    if (group) {
      setName(group.name || '');
      setDescription(group.description || '');
      setAvatarUri(group.avatarUrl);
    }
  }, [group]);

  const validateForm = (): boolean => {
    const newErrors = {
      name: '',
      description: '',
    };

    if (!name.trim()) {
      newErrors.name = 'Group name is required';
    } else if (name.trim().length < 3) {
      newErrors.name = 'Group name must be at least 3 characters';
    } else if (name.trim().length > 50) {
      newErrors.name = 'Group name must be less than 50 characters';
    }

    if (description && description.length > 200) {
      newErrors.description = 'Description must be less than 200 characters';
    }

    setErrors(newErrors);
    return !newErrors.name && !newErrors.description;
  };

  const handleAvatarPress = async () => {
    try {
      // Import dynamically to avoid issues if not used
      const { pickImage, validateImage } = await import('../utils/imagePicker');
      
      // Pick image
      const image = await pickImage();
      if (!image) return;

      // Validate image
      const validation = validateImage(image);
      if (!validation.valid) {
        Alert.alert('Error', validation.error || 'Invalid image');
        return;
      }

      // TODO: Upload image to server and get URL
      // For now, just use local URI
      setAvatarUri(image.uri);
      
      Alert.alert('Note', 'Image upload functionality needs to be implemented');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to pick image');
    }
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      const updateData: any = {};
      
      // Only include changed fields
      if (name.trim() !== group?.name) {
        updateData.name = name.trim();
      }
      
      if (description !== group?.description) {
        updateData.description = description || undefined;
      }
      
      if (avatarUri && avatarUri !== group?.avatarUrl) {
        updateData.avatar = avatarUri;
      }

      // Only update if there are changes
      if (Object.keys(updateData).length === 0) {
        Alert.alert('No Changes', 'No changes to save');
        return;
      }

      await updateGroupMutation.mutateAsync({
        chatId: groupId,
        data: updateData,
      });
      
      Alert.alert(
        'Success',
        'Group details updated successfully',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert(
        'Error',
        error?.response?.data?.error || 'Failed to update group details'
      );
    }
  };

  if (isLoading || !group) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title="Edit Group" />
        </Appbar.Header>
        <View style={styles.loadingContainer}>
          <Text variant="bodyLarge" style={{ color: colors.text }}>
            Loading...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Edit Group" />
      </Appbar.Header>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={handleAvatarPress} style={styles.avatarButton}>
            {avatarUri ? (
              <Avatar.Image size={100} source={{ uri: avatarUri }} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                <Icon name="account-group" size={48} color="#FFFFFF" />
              </View>
            )}
          </TouchableOpacity>
          <Text variant="bodySmall" style={[styles.avatarHint, { color: colors.text }]}>
            Tap to change group photo
          </Text>
        </View>

        <View style={styles.form}>
          <TextInput
            label="Group Name *"
            value={name}
            onChangeText={(text) => {
              setName(text);
              setErrors({ ...errors, name: '' });
            }}
            mode="outlined"
            error={!!errors.name}
            disabled={updateGroupMutation.isPending}
            maxLength={50}
            style={styles.input}
          />
          {errors.name ? (
            <Text variant="bodySmall" style={styles.errorText}>
              {errors.name}
            </Text>
          ) : null}
          <Text variant="bodySmall" style={[styles.hint, { color: colors.text }]}>
            {name.length}/50 characters
          </Text>

          <TextInput
            label="Description (Optional)"
            value={description}
            onChangeText={(text) => {
              setDescription(text);
              setErrors({ ...errors, description: '' });
            }}
            mode="outlined"
            multiline
            numberOfLines={4}
            error={!!errors.description}
            disabled={updateGroupMutation.isPending}
            maxLength={200}
            style={styles.input}
          />
          {errors.description ? (
            <Text variant="bodySmall" style={styles.errorText}>
              {errors.description}
            </Text>
          ) : null}
          <Text variant="bodySmall" style={[styles.hint, { color: colors.text }]}>
            {description.length}/200 characters
          </Text>

          <Button
            mode="contained"
            onPress={handleSave}
            loading={updateGroupMutation.isPending}
            disabled={updateGroupMutation.isPending}
            style={styles.button}
          >
            Save Changes
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flexGrow: 1,
    padding: 24,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarButton: {
    marginBottom: 8,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarHint: {
    opacity: 0.6,
  },
  form: {
    width: '100%',
  },
  input: {
    marginBottom: 8,
  },
  errorText: {
    color: '#F44336',
    marginBottom: 8,
  },
  hint: {
    marginBottom: 16,
    opacity: 0.6,
  },
  button: {
    marginTop: 16,
    paddingVertical: 6,
  },
});

export default EditGroupScreen;
