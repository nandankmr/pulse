import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { AuthResponse, AuthTokens, loginAPI } from '../api/auth';
import { User } from '../store/authSlice';
import { getDeviceInfo } from '../utils/deviceInfo';
import config from '../config';
import { saveFirebaseSession, getStoredFirebaseSession, removeFirebaseSession, FirebaseSession } from '../utils/storage';

const mapFirebaseUserToUser = (firebaseUser: FirebaseAuthTypes.User): User => {
  return {
    id: firebaseUser.uid,
    name: firebaseUser.displayName ?? firebaseUser.email ?? 'Firebase User',
    email: firebaseUser.email ?? '',
    avatarUrl: firebaseUser.photoURL,
    verified: firebaseUser.emailVerified,
    createdAt: firebaseUser.metadata?.creationTime ?? undefined,
    updatedAt: firebaseUser.metadata?.lastSignInTime ?? undefined,
  };
};

const buildAuthTokens = async (firebaseUser: FirebaseAuthTypes.User): Promise<AuthTokens> => {
  const deviceInfo = await getDeviceInfo();
  const accessToken = await firebaseUser.getIdToken(true);
  return {
    accessToken,
    refreshToken: '',
    deviceId: deviceInfo.deviceId,
  };
};

const needsBackendExchange = config.USE_FIREBASE_AUTH;

const exchangeFirebaseSession = async (
  firebaseUser: FirebaseAuthTypes.User
): Promise<AuthResponse> => {
  if (!firebaseUser.email) {
    throw new Error('Firebase user email is required for backend session exchange.');
  }

  const idToken = await firebaseUser.getIdToken(true);
  const deviceInfo = await getDeviceInfo();

  const response = await loginAPI({
    email: firebaseUser.email,
    deviceId: deviceInfo.deviceId,
    deviceName: deviceInfo.deviceName,
    platform: deviceInfo.platform,
    firebaseIdToken: idToken,
  });

  await saveFirebaseSession(response as FirebaseSession);
  return response;
};

export const firebaseSignIn = async (email: string, password?: string): Promise<AuthResponse> => {
  if (!password) {
    throw new Error('Password is required to sign in with Firebase authentication.');
  }

  const credential = await auth().signInWithEmailAndPassword(email, password);

  if (needsBackendExchange) {
    return exchangeFirebaseSession(credential.user);
  }

  const user = mapFirebaseUserToUser(credential.user);
  const tokens = await buildAuthTokens(credential.user);
  const session: FirebaseSession = { user, tokens };
  await saveFirebaseSession(session);
  return session;
};

export const firebaseRegister = async (
  name: string,
  email: string,
  password: string
): Promise<void> => {
  const credential = await auth().createUserWithEmailAndPassword(email, password);

  if (name && credential.user.displayName !== name) {
    await credential.user.updateProfile({ displayName: name });
  }

  if (!credential.user.emailVerified) {
    await credential.user.sendEmailVerification();
  }
};

export const firebaseLogout = async (): Promise<void> => {
  await removeFirebaseSession();
  await auth().signOut();
};

export const getFirebaseSession = async (): Promise<AuthResponse | null> => {
  const stored = await getStoredFirebaseSession();
  if (stored) {
    return stored;
  }

  const currentUser = auth().currentUser;
  if (!currentUser) {
    return null;
  }

  await currentUser.reload();
  const refreshedUser = auth().currentUser;
  if (!refreshedUser) {
    return null;
  }

  if (needsBackendExchange) {
    return exchangeFirebaseSession(refreshedUser);
  }

  const user = mapFirebaseUserToUser(refreshedUser);
  const tokens = await buildAuthTokens(refreshedUser);
  const session: FirebaseSession = { user, tokens };
  await saveFirebaseSession(session);
  return session;
};

export const firebaseSendEmailVerification = async (): Promise<void> => {
  const currentUser = auth().currentUser;
  if (!currentUser) {
    throw new Error('No authenticated Firebase user.');
  }

  await currentUser.sendEmailVerification();
};

export const firebaseReloadUser = async (): Promise<User | null> => {
  const currentUser = auth().currentUser;
  if (!currentUser) {
    return null;
  }

  await currentUser.reload();
  const reloaded = auth().currentUser;
  if (!reloaded) {
    return null;
  }

  return mapFirebaseUserToUser(reloaded);
};

export const firebaseSendPasswordResetEmail = async (email: string): Promise<void> => {
  await auth().sendPasswordResetEmail(email);
};

export const firebaseChangePassword = async (
  currentPassword: string,
  newPassword: string
): Promise<void> => {
  const currentUser = auth().currentUser;
  if (!currentUser || !currentUser.email) {
    throw new Error('No authenticated Firebase user.');
  }

  const credential = auth.EmailAuthProvider.credential(currentUser.email, currentPassword);
  await currentUser.reauthenticateWithCredential(credential);
  await currentUser.updatePassword(newPassword);
};

export const firebaseConfirmPasswordReset = async (
  code: string,
  newPassword: string
): Promise<void> => {
  await auth().confirmPasswordReset(code, newPassword);
};

export const firebaseGetCurrentUser = (): FirebaseAuthTypes.User | null => {
  return auth().currentUser;
};

export const refreshFirebaseIdToken = async (): Promise<string | null> => {
  const currentUser = auth().currentUser;
  if (!currentUser) {
    return null;
  }

  return currentUser.getIdToken(true);
};
