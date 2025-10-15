// src/navigation/AppNavigator.tsx

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import HomeScreen from '../screens/HomeScreen.tsx';
import ProfileScreen from '../screens/ProfileScreen.tsx';
import LoginScreen from '../screens/LoginScreen.tsx';
import RegisterScreen from '../screens/RegisterScreen.tsx';
import EmailVerificationScreen from '../screens/EmailVerificationScreen.tsx';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen.tsx';
import ResetPasswordScreen from '../screens/ResetPasswordScreen.tsx';
import ChatScreen from '../screens/ChatScreen.tsx';
import CreateGroupScreen from '../screens/CreateGroupScreen.tsx';
import GroupSettingsScreen from '../screens/GroupSettingsScreen.tsx';
import EditGroupScreen from '../screens/EditGroupScreen.tsx';
import UserSearchScreen from '../screens/UserSearchScreen.tsx';
import ChangePasswordScreen from '../screens/ChangePasswordScreen.tsx';
import UserDetailsScreen from '../screens/UserDetailsScreen.tsx';
import GroupDetailsScreen from '../screens/GroupDetailsScreen.tsx';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Define navigation types
export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  EmailVerification: { email: string };
  ForgotPassword: undefined;
  ResetPassword: { email: string };
  Main: undefined;
  Chat: { chatId: string; chatName?: string; isGroup?: boolean };
  CreateGroup: undefined;
  GroupSettings: { groupId: string };
  EditGroup: { groupId: string };
  UserSearch: undefined;
  ChangePassword: undefined;
  UserDetails: { userId: string };
  GroupDetails: { groupId: string; groupName?: string; groupAvatar?: string };
  Home: undefined;
  Profile: undefined;
  Chats: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2196F3',
        tabBarInactiveTintColor: '#757575',
      }}
    >
      <Tab.Screen
        name="Chats"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="message-text" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="account" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={isAuthenticated ? 'Main' : 'Login'}
        screenOptions={{ headerShown: false }}
      >
        {!isAuthenticated ? (
          // Auth Stack
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="EmailVerification" component={EmailVerificationScreen} />
            <Stack.Screen 
              name="ForgotPassword" 
              component={ForgotPasswordScreen}
              options={{ headerShown: true, title: 'Forgot Password' }}
            />
            <Stack.Screen 
              name="ResetPassword" 
              component={ResetPasswordScreen}
              options={{ headerShown: true, title: 'Reset Password' }}
            />
          </>
        ) : (
          // App Stack
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen 
              name="Chat" 
              component={ChatScreen}
              options={{ headerShown: true, title: 'Chat' }}
            />
            <Stack.Screen 
              name="CreateGroup" 
              component={CreateGroupScreen}
              options={{ headerShown: true, title: 'Create Group' }}
            />
            <Stack.Screen 
              name="GroupSettings" 
              component={GroupSettingsScreen}
              options={{ headerShown: true, title: 'Group Settings' }}
            />
            <Stack.Screen 
              name="EditGroup" 
              component={EditGroupScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="UserSearch" 
              component={UserSearchScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="ChangePassword" 
              component={ChangePasswordScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="UserDetails" 
              component={UserDetailsScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="GroupDetails" 
              component={GroupDetailsScreen}
              options={{ headerShown: false }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
