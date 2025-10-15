// src/components/UserAvatar.tsx

import React from 'react';
import { Avatar } from 'react-native-paper';
import { StyleProp, ViewStyle } from 'react-native';
import DefaultAvatar from './DefaultAvatar';

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
  if (avatarUrl) {
    return (
      <Avatar.Image
        size={size}
        source={{ uri: avatarUrl }}
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
