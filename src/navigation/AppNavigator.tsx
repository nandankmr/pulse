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
import ChatScreen from '../screens/ChatScreen.tsx';
import CreateGroupScreen from '../screens/CreateGroupScreen.tsx';
import GroupSettingsScreen from '../screens/GroupSettingsScreen.tsx';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const Stack = createStackNavigator();
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
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
