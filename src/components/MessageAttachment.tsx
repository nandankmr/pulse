// src/components/MessageAttachment.tsx

import React from 'react';
import { View, StyleSheet, Image, TouchableOpacity, Linking } from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import { Attachment } from '../types/message';
import { formatFileSize, formatDuration } from '../utils/attachmentUpload';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface MessageAttachmentProps {
  attachment: Attachment;
  onPress?: () => void;
}

const MessageAttachment: React.FC<MessageAttachmentProps> = ({ attachment, onPress }) => {
  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      // Default: open in browser or external app
      Linking.openURL(attachment.url).catch((err) =>
        console.error('Failed to open attachment:', err)
      );
    }
  };

  const renderImageAttachment = () => (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
      <Image
        source={{ uri: attachment.url }}
        style={styles.image}
        resizeMode="cover"
      />
    </TouchableOpacity>
  );

  const renderVideoAttachment = () => (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.8} style={styles.videoContainer}>
      {attachment.thumbnail ? (
        <Image
          source={{ uri: attachment.thumbnail }}
          style={styles.image}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.image, styles.videoPlaceholder]}>
          <Icon name="video" size={48} color="#FFFFFF" />
        </View>
      )}
      <View style={styles.videoOverlay}>
        <Icon name="play-circle" size={48} color="#FFFFFF" />
      </View>
      {attachment.duration && (
        <View style={styles.durationBadge}>
          <Text variant="bodySmall" style={styles.durationText}>
            {formatDuration(attachment.duration)}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderAudioAttachment = () => (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.8} style={styles.audioContainer}>
      <Icon name="music" size={32} color="#2196F3" />
      <View style={styles.audioInfo}>
        <Text variant="bodyMedium" numberOfLines={1}>
          {attachment.name || 'Audio'}
        </Text>
        <Text variant="bodySmall" style={styles.fileSize}>
          {attachment.duration && `${formatDuration(attachment.duration)} • `}
          {formatFileSize(attachment.size)}
        </Text>
      </View>
      <IconButton icon="play" size={24} />
    </TouchableOpacity>
  );

  const renderFileAttachment = () => (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.8} style={styles.fileContainer}>
      <Icon name="file-document" size={32} color="#757575" />
      <View style={styles.fileInfo}>
        <Text variant="bodyMedium" numberOfLines={1}>
          {attachment.name || 'File'}
        </Text>
        <Text variant="bodySmall" style={styles.fileSize}>
          {formatFileSize(attachment.size)}
        </Text>
      </View>
      <IconButton icon="download" size={24} />
    </TouchableOpacity>
  );

  const renderLocationAttachment = () => (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.8} style={styles.locationContainer}>
      <View style={styles.locationMap}>
        <Icon name="map-marker" size={48} color="#F44336" />
      </View>
      <View style={styles.locationInfo}>
        <Text variant="bodyMedium">📍 Location</Text>
        {attachment.latitude && attachment.longitude && (
          <Text variant="bodySmall" style={styles.coordinates}>
            {attachment.latitude.toFixed(6)}, {attachment.longitude.toFixed(6)}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  switch (attachment.type) {
    case 'image':
      return renderImageAttachment();
    case 'video':
      return renderVideoAttachment();
    case 'audio':
      return renderAudioAttachment();
    case 'location':
      return renderLocationAttachment();
    case 'file':
    default:
      return renderFileAttachment();
  }
};

const styles = StyleSheet.create({
  image: {
    width: 200,
    height: 200,
    borderRadius: 8,
  },
  videoContainer: {
    position: 'relative',
  },
  videoPlaceholder: {
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 8,
  },
  durationBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  durationText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  audioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    minWidth: 250,
  },
  audioInfo: {
    flex: 1,
    marginLeft: 12,
  },
  fileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    minWidth: 250,
  },
  fileInfo: {
    flex: 1,
    marginLeft: 12,
  },
  fileSize: {
    opacity: 0.6,
    marginTop: 2,
  },
  locationContainer: {
    borderRadius: 8,
    overflow: 'hidden',
    minWidth: 250,
  },
  locationMap: {
    height: 150,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationInfo: {
    padding: 12,
    backgroundColor: '#F5F5F5',
  },
  coordinates: {
    opacity: 0.6,
    marginTop: 4,
  },
});

export default MessageAttachment;
