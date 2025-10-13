# Platform Setup Guide

This guide covers the platform-specific setup required for iOS and Android.

## iOS Setup

### 1. Install Pods
```bash
cd ios
pod install
cd ..
```

### 2. Update Info.plist
Add these permissions to `ios/pulse/Info.plist`:

```xml
<key>NSPhotoLibraryUsageDescription</key>
<string>Allow Pulse to access your photos to share images</string>

<key>NSCameraUsageDescription</key>
<string>Allow Pulse to use your camera to take photos and videos</string>

<key>NSMicrophoneUsageDescription</key>
<string>Allow Pulse to use your microphone for video recording</string>

<key>NSLocationWhenInUseUsageDescription</key>
<string>Allow Pulse to access your location to share it in messages</string>

<key>NSLocationAlwaysUsageDescription</key>
<string>Allow Pulse to access your location to share it in messages</string>
```

### 3. Build iOS
```bash
npx react-native run-ios
```

## Android Setup

### 1. Update AndroidManifest.xml
Add these permissions to `android/app/src/main/AndroidManifest.xml`:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    
    <!-- Camera and Storage Permissions -->
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
    <uses-permission android:name="android.permission.READ_MEDIA_VIDEO" />
    
    <!-- Location Permissions -->
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    
    <!-- Internet Permission (should already exist) -->
    <uses-permission android:name="android.permission.INTERNET" />
    
    <application ...>
        ...
    </application>
</manifest>
```

### 2. Update build.gradle (if needed)
Ensure `android/app/build.gradle` has:

```gradle
android {
    compileSdkVersion 34
    
    defaultConfig {
        minSdkVersion 23
        targetSdkVersion 34
    }
}
```

### 3. Build Android
```bash
npx react-native run-android
```

## Testing Permissions

### Test Camera Access
1. Tap the paperclip icon in a chat
2. Select "Take Photo" or "Take Video"
3. Grant camera permission when prompted
4. Capture photo/video

### Test Gallery Access
1. Tap the paperclip icon in a chat
2. Select "Choose from Gallery"
3. Grant photo library permission when prompted
4. Select media

### Test Location Access
1. Tap the paperclip icon in a chat
2. Select "Share Location"
3. Grant location permission when prompted
4. Location should be shared

## Troubleshooting

### iOS Issues

**Camera not working:**
- Check Info.plist has all required keys
- Run `cd ios && pod install && cd ..`
- Clean build: `cd ios && xcodebuild clean && cd ..`

**Location not working:**
- Ensure both WhenInUse and Always descriptions are in Info.plist
- Check Location Services are enabled in iOS Settings

### Android Issues

**Camera permission denied:**
- Check AndroidManifest.xml has CAMERA permission
- For Android 13+, ensure READ_MEDIA_IMAGES and READ_MEDIA_VIDEO are added
- Clear app data and reinstall

**Location permission denied:**
- Check AndroidManifest.xml has location permissions
- For Android 12+, ensure both FINE and COARSE are requested
- Enable location in device settings

**Build errors:**
- Run `cd android && ./gradlew clean && cd ..`
- Check minSdkVersion is at least 23
- Ensure all dependencies are installed

## Environment Variables

Create `.env` file in project root:

```env
API_URL=http://localhost:3000/api
SOCKET_URL=http://localhost:3000
```

For production, update with your actual API URLs.

## Next Steps

After platform setup:
1. Run the app on device/emulator
2. Test all attachment features
3. Connect to backend API
4. Test real-time messaging with Socket.io
