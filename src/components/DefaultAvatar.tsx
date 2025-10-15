// src/components/DefaultAvatar.tsx

import React from 'react';
import { Avatar } from 'react-native-paper';
import { StyleProp, ViewStyle } from 'react-native';

interface DefaultAvatarProps {
  size: number;
  name?: string;
  isGroup?: boolean;
  style?: StyleProp<ViewStyle>;
}

const DefaultAvatar: React.FC<DefaultAvatarProps> = ({ size, name, isGroup = false, style }) => {
  // Get initials from name
  const getInitials = (fullName?: string): string => {
    if (!fullName) return isGroup ? 'G' : 'U';
    
    const names = fullName.trim().split(' ');
    if (names.length === 1) {
      return names[0].charAt(0).toUpperCase();
    }
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  // Generate a consistent color based on the name
  const getColorFromName = (fullName?: string): string => {
    if (!fullName) return isGroup ? '#2196F3' : '#9E9E9E';
    
    const colors = [
      '#F44336', // Red
      '#E91E63', // Pink
      '#9C27B0', // Purple
      '#673AB7', // Deep Purple
      '#3F51B5', // Indigo
      '#2196F3', // Blue
      '#03A9F4', // Light Blue
      '#00BCD4', // Cyan
      '#009688', // Teal
      '#4CAF50', // Green
      '#8BC34A', // Light Green
      '#FF9800', // Orange
      '#FF5722', // Deep Orange
      '#795548', // Brown
      '#607D8B', // Blue Grey
    ];
    
    let hash = 0;
    for (let i = 0; i < fullName.length; i++) {
      hash = fullName.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  const initials = getInitials(name);
  const backgroundColor = getColorFromName(name);

  return (
    <Avatar.Text
      size={size}
      label={initials}
      style={[{ backgroundColor }, style]}
      color="#FFFFFF"
    />
  );
};

export default DefaultAvatar;
