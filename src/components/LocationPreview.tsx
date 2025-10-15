// src/components/LocationPreview.tsx

import React from 'react';
import { View, StyleSheet, TouchableOpacity, Linking, Platform, Image } from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import { useTheme } from '../theme/ThemeContext';

interface LocationPreviewProps {
  latitude: number;
  longitude: number;
  onPress?: () => void;
}

const LocationPreview: React.FC<LocationPreviewProps> = ({ latitude, longitude, onPress }) => {
  const { colors } = useTheme();

  // Generate static map image URL
  const getStaticMapUrl = () => {
    const zoom = 15;
    const width = 250;
    const height = 150;
    
    // Using OpenStreetMap static map
    return `https://staticmap.openstreetmap.de/staticmap.php?center=${latitude},${longitude}&zoom=${zoom}&size=${width}x${height}&markers=${latitude},${longitude},red-pushpin`;
  };

  const openInMaps = () => {
    const latLng = `${latitude},${longitude}`;
    const label = 'Shared Location';
    
    // Use platform-specific URL schemes
    const scheme = Platform.select({
      ios: 'maps:0,0?q=',
      android: 'geo:0,0?q='
    });
    
    const url = Platform.select({
      ios: `${scheme}${label}@${latLng}`,
      android: `${scheme}${latLng}(${label})`
    });

    // Try to open native maps app
    Linking.canOpenURL(url!).then(supported => {
      if (supported) {
        Linking.openURL(url!);
      } else {
        // Fallback to Google Maps web
        const googleMapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
        Linking.openURL(googleMapsUrl);
      }
    }).catch(() => {
      // Fallback to Google Maps web
      const googleMapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
      Linking.openURL(googleMapsUrl);
    });
  };

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      openInMaps();
    }
  };

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.surface }]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {/* Map Preview */}
      <View style={styles.mapContainer}>
        <Image
          source={{ uri: getStaticMapUrl() }}
          style={styles.mapImage}
          resizeMode="cover"
        />
      </View>

      {/* Location Info */}
      <View style={[styles.infoContainer, { backgroundColor: colors.background }]}>
        <View style={styles.infoRow}>
          <IconButton icon="map-marker" iconColor={colors.primary} size={20} />
          <View style={styles.textContainer}>
            <Text style={[styles.title, { color: colors.text }]}>Location</Text>
            <Text style={[styles.coordinates, { color: colors.text }]}>
              {latitude.toFixed(6)}, {longitude.toFixed(6)}
            </Text>
          </View>
        </View>
        <IconButton
          icon="open-in-new"
          iconColor={colors.primary}
          size={20}
          onPress={openInMaps}
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    width: 250,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  mapContainer: {
    width: 250,
    height: 150,
    overflow: 'hidden',
  },
  mapImage: {
    width: '100%',
    height: '100%',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  textContainer: {
    flex: 1,
    marginLeft: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
  },
  coordinates: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 2,
  },
});

export default LocationPreview;
