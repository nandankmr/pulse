// src/config/index.ts

/**
 * Application configuration
 * Update these values based on your environment
 */

const config = {
  // API Configuration
  // Note: For Android Emulator, use 10.0.2.2 instead of localhost
  // For iOS Simulator, use localhost
  // For physical device, use your computer's IP address (e.g., 192.168.1.x)
  API_URL: // 'http://10.0.2.2:3000/api' || 
  'https://pulse-api-8yia.onrender.com/api',

  // Socket Configuration
  SOCKET_URL: // 'http://10.0.2.2:3000' || 
  'https://pulse-api-8yia.onrender.com',
  
  // API Timeout
  API_TIMEOUT: 10000,
  USE_FIREBASE_AUTH: true,
};

export default config;
