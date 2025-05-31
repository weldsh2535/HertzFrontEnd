import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useSelector } from 'react-redux';
import AuthNavigator from './AuthNavigator';
import MainTabNavigator from './MainTabNavigator';
import LoadingIndicator from '../components/Common/LoadingIndicator';

const Stack = createStackNavigator();

export default function AppNavigator() {
  const { isAuthenticated, loading } = useSelector((state) => ({
    isAuthenticated: state.auth.isAuthenticated,
    loading: state.auth.loading,
  }));
   console.log('Auth state:', isAuthenticated, loading);

  if (loading) {
    return <LoadingIndicator />;
  }

  return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="Main" component={MainTabNavigator} />
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
  );
}