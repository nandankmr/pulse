# Image Picker Setup Guide

## Installation

✅ Already installed: `react-native-image-picker`

## Platform Configuration

### iOS Setup

1. **Add permissions to `ios/pulse/Info.plist`:**

```xml
<key>NSCameraUsageDescription</key>
<string>We need access to your camera to take profile pictures</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>We need access to your photo library to select profile pictures</string>
<key>NSPhotoLibraryAddUsageDescription</key>
<string>We need access to save photos to your library</string>
```

2. **Install iOS dependencies:**

```bash
cd ios && pod install && cd ..
```

### Android Setup

1. **Add permissions to `android/app/src/main/AndroidManifest.xml`:**

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
  <!-- Add these permissions -->
  <uses-permission android:name="android.permission.CAMERA" />
  <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
  <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" 
                   android:maxSdkVersion="32" />
  <uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
  
  <!-- Camera feature (optional, makes camera required) -->
  <uses-feature android:name="android.permission.CAMERA" android:required="false" />
  
  <application ...>
    ...
  </application>
</manifest>
```

2. **For Android 13+ (API 33+), request runtime permissions:**

The library handles this automatically, but you may need to add this to your `android/app/build.gradle`:

```gradle
android {
    compileSdkVersion 34
    targetSdkVersion 34
    // ...
}
```

## Usage

The image picker is now fully integrated in `ProfileScreen`:

1. Navigate to Profile screen
2. Click "Edit Profile"
3. Tap on the avatar
4. Choose "Take Photo" or "Choose from Library"
5. Image will be validated and uploaded

## Features

- ✅ Camera capture
- ✅ Gallery selection
- ✅ Image validation (5MB max, JPEG/PNG/WebP)
- ✅ Automatic resizing (1024x1024 max)
- ✅ Quality compression (0.8)
- ✅ Error handling
- ✅ Loading states

## API Integration

To connect with backend, uncomment lines 87-100 in `ProfileScreen.tsx`:

```typescript
// 1. Get presigned URL
const { presignedUrl, url } = await getAvatarUploadUrlAPI(
  image.name,
  image.type
);

// 2. Upload to S3
const blob = await fetch(image.uri).then(r => r.blob());
await uploadAvatarToS3(presignedUrl, blob, image.type);

// 3. Confirm upload and update profile
const response = await confirmAvatarUploadAPI(url);
dispatch(updateUser(response.user));
```

## Testing

### iOS Simulator
- Camera: Not available (will show error)
- Gallery: Works with simulator photos

### Android Emulator
- Camera: Works with emulated camera
- Gallery: Works with emulated storage

### Physical Devices
- Both camera and gallery work fully

## Troubleshooting

### iOS: "User did not grant library permission"
- Go to Settings → Privacy → Photos → [Your App]
- Enable access

### Android: "Permission denied"
- Go to Settings → Apps → [Your App] → Permissions
- Enable Camera and Storage

### Build errors
- Make sure to run `pod install` for iOS
- Clean build: `cd android && ./gradlew clean && cd ..`

## Notes

- Images are automatically compressed to 80% quality
- Maximum dimensions: 1024x1024 pixels
- Maximum file size: 5MB
- Supported formats: JPEG, PNG, WebP
- Avatar updates are persisted to AsyncStorage via Redux middleware
