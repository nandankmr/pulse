// src/components/UserAvatar.tsx

import React from 'react';
import { Avatar } from 'react-native-paper';
import { StyleProp, ViewStyle } from 'react-native';
import DefaultAvatar from './DefaultAvatar';
import { ensureAbsoluteUrl } from '../utils/url';

interface UserAvatarProps {
  size: number;
  avatarUrl?: string | null;
  name?: string;
  isGroup?: boolean;
  style?: StyleProp<ViewStyle>;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ 
  size, 
  avatarUrl, 
  name, 
  isGroup = false, 
  style 
}) => {
  const normalizedUrl = ensureAbsoluteUrl(avatarUrl);

  if (normalizedUrl) {
    return (
      <Avatar.Image
        size={size}
        source={{ uri: normalizedUrl }}
        style={style}
      />
    );
  }

  return (
    <DefaultAvatar
      size={size}
      name={name}
      isGroup={isGroup}
      style={style}
    />
  );
};

export default UserAvatar;
