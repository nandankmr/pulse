// src/navigation/navigationRef.ts

import { createNavigationContainerRef } from '@react-navigation/native';
import type { RootStackParamList } from './types';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

type ReadyListener = () => void;
const readyListeners = new Set<ReadyListener>();

export const addNavigationReadyListener = (listener: ReadyListener) => {
  readyListeners.add(listener);

  return () => {
    readyListeners.delete(listener);
  };
};

export const notifyNavigationReady = () => {
  readyListeners.forEach((listener) => listener());
};

export const navigateToChat = (params: RootStackParamList['Chat']): boolean => {
  if (!navigationRef.isReady()) {
    return false;
  }

  navigationRef.navigate('Chat', params);
  return true;
};
